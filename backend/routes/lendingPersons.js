// backend/routes/lendingPersons.js
const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Loan = require('../models/Loan');
const { getPersonAggregate } = require('../services/lendingService');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { paramsIdSchema } = require('../validationSchemas/commonSchemas');
const {
  createPersonSchema,
  updatePersonSchema,
  queryPersonSchema,
} = require('../validationSchemas/lendingSchemas');

// Helper to check write permissions
const checkCanModify = (req) => {
  const role = req.user?.role || 'viewer';
  if (role === 'viewer') {
    throw new ForbiddenError('Viewers are not permitted to modify lending records');
  }
};

// @route   POST /api/lending/persons
// @desc    Create a new person for lending tracking
router.post(
  '/',
  auth,
  validate({ body: createPersonSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const body = getValidated(req, 'body');

    const person = await Person.create({
      user: req.effectiveUserId,
      name: body.name,
      note: body.note || '',
    });

    res.status(201).json({
      success: true,
      data: person,
    });
  })
);

// @route   GET /api/lending/persons
// @desc    List persons with computed active debt and loan count
router.get(
  '/',
  auth,
  validate({ query: queryPersonSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder, search } = getValidated(req, 'query');
    const filter = { user: req.effectiveUserId, deletedAt: null };

    if (search) {
      filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    // Two-query pattern: fetch persons, then fetch and aggregate their loans in memory
    const persons = await Person.find(filter).lean();
    const personIds = persons.map((p) => p._id);

    const loans = await Loan.find({
      user: req.effectiveUserId,
      person: { $in: personIds },
      deletedAt: null,
    })
      .select('person status transactions')
      .lean();

    const loansByPerson = new Map();
    for (const loan of loans) {
      const pid = loan.person.toString();
      if (!loansByPerson.has(pid)) {
        loansByPerson.set(pid, []);
      }
      loansByPerson.get(pid).push(loan);
    }

    const joined = persons.map((p) => {
      const pLoans = loansByPerson.get(p._id.toString()) || [];
      let totalOwedInPiastres = 0;
      let activeCount = 0;

      for (const l of pLoans) {
        if (l.status === 'Active') {
          const borrowed = (l.transactions || [])
            .filter((t) => t.type === 'borrow')
            .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
          const repaid = (l.transactions || [])
            .filter((t) => t.type === 'repay')
            .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
          const balance = borrowed - repaid;
          if (balance > 0) {
            totalOwedInPiastres += balance;
            activeCount += 1;
          }
        }
      }

      return {
        ...p,
        totalOwedInPiastres,
        loanCount: pLoans.length,
        activeLoanCount: activeCount,
      };
    });

    // Sort joined result
    joined.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'totalOwed') {
        valA = a.totalOwedInPiastres;
        valB = b.totalOwedInPiastres;
      } else if (sortBy === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = joined.length;
    const skip = (page - 1) * limit;
    const paginated = joined.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  })
);

// @route   GET /api/lending/persons/:id
// @desc    Get person detail with associated loans and debt aggregation
router.get(
  '/:id',
  auth,
  validate({ params: paramsIdSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const person = await Person.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    }).lean();

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    const loans = await Loan.find({
      user: req.effectiveUserId,
      person: id,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const aggregate = await getPersonAggregate(req.effectiveUserId, id);

    res.status(200).json({
      success: true,
      data: {
        person,
        loans,
        aggregate,
      },
    });
  })
);

// @route   PUT /api/lending/persons/:id
// @desc    Update person name and note
router.put(
  '/:id',
  auth,
  validate({ params: paramsIdSchema, body: updatePersonSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const { id } = getValidated(req, 'params');
    const body = getValidated(req, 'body');

    const person = await Person.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    if (body.name !== undefined) person.name = body.name;
    if (body.note !== undefined) person.note = body.note;

    await person.save();

    res.status(200).json({
      success: true,
      data: person,
    });
  })
);

// @route   DELETE /api/lending/persons/:id
// @desc    Soft delete person (blocks if active loan has positive balance)
router.delete(
  '/:id',
  auth,
  validate({ params: paramsIdSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const { id } = getValidated(req, 'params');

    const person = await Person.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    // Check active loans for positive balance
    const activeLoans = await Loan.find({
      user: req.effectiveUserId,
      person: id,
      status: 'Active',
      deletedAt: null,
    }).lean();

    for (const l of activeLoans) {
      const borrowed = (l.transactions || [])
        .filter((t) => t.type === 'borrow')
        .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
      const repaid = (l.transactions || [])
        .filter((t) => t.type === 'repay')
        .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
      if (borrowed - repaid > 0) {
        throw new BadRequestError('Cannot delete person with active outstanding balance');
      }
    }

    await person.softDelete();

    res.status(200).json({
      success: true,
      message: 'Person deleted successfully',
    });
  })
);

module.exports = router;
