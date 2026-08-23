// backend/scripts/backfillCurrencyPiastres.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Expenditure = require('../models/Expenditure');
const Certificate = require('../models/Certificate');
const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const CardPayment = require('../models/CardPayment');
const Currency = require('../models/Currency');
const Gold = require('../models/Gold');
const MutualFundTrade = require('../models/MutualFundTrade');
const Paycheck = require('../models/Paycheck');
const SalaryProfile = require('../models/SalaryProfile');
const SocialInsurance = require('../models/SocialInsurance');
const TaxBracket = require('../models/TaxBracket');
const Trade = require('../models/Trade');

const { toPiastres } = require('../utils/currencyUtils');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Currency Piastre Backfill...');
  } catch (err) {
    console.error(`DB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

const backfillCurrencyPiastres = async () => {
  await connectDB();

  try {
    console.log('--- Starting Streamed Currency Piastre & Soft Delete Backfill ---');

    // 1. Expenditure Backfill (Streamed)
    console.log('Processing Expenditures...');
    const expCursor = Expenditure.find({}).cursor();
    let expBatch = [];
    let expUpdated = 0;
    for await (const exp of expCursor) {
      const tvPiastres = toPiastres(exp.transactionValue);
      const bankPiastres = toPiastres(exp.runningBalances?.bank ?? exp.bank ?? 0);
      const cashPiastres = toPiastres(exp.runningBalances?.cash ?? exp.cash ?? 0);
      const prepaidPiastres = toPiastres(exp.runningBalances?.prepaid ?? exp.prepaid ?? 0);

      const updateFields = {
        transactionValueInPiastres: tvPiastres,
        bankInPiastres: bankPiastres,
        cashInPiastres: cashPiastres,
        prepaidInPiastres: prepaidPiastres,
        runningBalancesInPiastres: {
          bank: bankPiastres,
          cash: cashPiastres,
          prepaid: prepaidPiastres,
        },
      };
      if (exp.deletedAt === undefined) {
        updateFields.deletedAt = null;
      }

      expBatch.push({
        updateOne: {
          filter: { _id: exp._id },
          update: { $set: updateFields },
        },
      });

      if (expBatch.length >= 250) {
        await Expenditure.bulkWrite(expBatch);
        expUpdated += expBatch.length;
        expBatch = [];
      }
    }
    if (expBatch.length > 0) {
      await Expenditure.bulkWrite(expBatch);
      expUpdated += expBatch.length;
    }
    console.log(`Updated ${expUpdated} Expenditure records.`);

    // 2. Certificate Backfill
    const certCursor = Certificate.find({}).cursor();
    let certBatch = [];
    let certUpdated = 0;
    for await (const cert of certCursor) {
      certBatch.push({
        updateOne: {
          filter: { _id: cert._id },
          update: {
            $set: {
              amountInPiastres: toPiastres(cert.amount),
              deletedAt: cert.deletedAt || null,
            },
          },
        },
      });
      if (certBatch.length >= 250) {
        await Certificate.bulkWrite(certBatch);
        certUpdated += certBatch.length;
        certBatch = [];
      }
    }
    if (certBatch.length > 0) {
      await Certificate.bulkWrite(certBatch);
      certUpdated += certBatch.length;
    }
    console.log(`Updated ${certUpdated} Certificate records.`);

    // 3. CreditCard Backfill
    const cards = await CreditCard.find({});
    for (const card of cards) {
      card.limitInPiastres = toPiastres(card.limit);
      if (card.deletedAt === undefined) card.deletedAt = null;
      await card.save();
    }
    console.log(`Updated ${cards.length} CreditCard records.`);

    // 4. CardTransaction Backfill
    const ctxCursor = CardTransaction.find({}).cursor();
    let ctxBatch = [];
    let ctxUpdated = 0;
    for await (const ctx of ctxCursor) {
      const updateDoc = {
        amountInPiastres: toPiastres(ctx.amount),
        paidAmountInPiastres: toPiastres(ctx.paidAmount),
        deletedAt: ctx.deletedAt || null,
      };
      if (ctx.installmentDetails?.monthlyPrincipal !== undefined) {
        updateDoc['installmentDetails.monthlyPrincipalInPiastres'] = toPiastres(ctx.installmentDetails.monthlyPrincipal);
      }
      ctxBatch.push({
        updateOne: {
          filter: { _id: ctx._id },
          update: { $set: updateDoc },
        },
      });
      if (ctxBatch.length >= 250) {
        await CardTransaction.bulkWrite(ctxBatch);
        ctxUpdated += ctxBatch.length;
        ctxBatch = [];
      }
    }
    if (ctxBatch.length > 0) {
      await CardTransaction.bulkWrite(ctxBatch);
      ctxUpdated += ctxBatch.length;
    }
    console.log(`Updated ${ctxUpdated} CardTransaction records.`);

    // 5. CardPayment Backfill
    const cpCursor = CardPayment.find({}).cursor();
    let cpBatch = [];
    let cpUpdated = 0;
    for await (const cp of cpCursor) {
      cpBatch.push({
        updateOne: {
          filter: { _id: cp._id },
          update: {
            $set: {
              amountInPiastres: toPiastres(cp.amount),
              deletedAt: cp.deletedAt || null,
            },
          },
        },
      });
      if (cpBatch.length >= 250) {
        await CardPayment.bulkWrite(cpBatch);
        cpUpdated += cpBatch.length;
        cpBatch = [];
      }
    }
    if (cpBatch.length > 0) {
      await CardPayment.bulkWrite(cpBatch);
      cpUpdated += cpBatch.length;
    }
    console.log(`Updated ${cpUpdated} CardPayment records.`);

    // 6. Currency Backfill
    const currCursor = Currency.find({}).cursor();
    let currBatch = [];
    let currUpdated = 0;
    for await (const curr of currCursor) {
      currBatch.push({
        updateOne: {
          filter: { _id: curr._id },
          update: {
            $set: {
              priceInPiastres: toPiastres(curr.price),
              deletedAt: curr.deletedAt || null,
            },
          },
        },
      });
      if (currBatch.length >= 250) {
        await Currency.bulkWrite(currBatch);
        currUpdated += currBatch.length;
        currBatch = [];
      }
    }
    if (currBatch.length > 0) {
      await Currency.bulkWrite(currBatch);
      currUpdated += currBatch.length;
    }
    console.log(`Updated ${currUpdated} Currency records.`);

    // 7. Gold Backfill
    const goldCursor = Gold.find({}).cursor();
    let goldBatch = [];
    let goldUpdated = 0;
    for await (const g of goldCursor) {
      goldBatch.push({
        updateOne: {
          filter: { _id: g._id },
          update: {
            $set: {
              priceInPiastres: toPiastres(g.price),
              paidInPiastres: toPiastres(g.paid),
              sellingPriceInPiastres: toPiastres(g.sellingPrice),
              deletedAt: g.deletedAt || null,
            },
          },
        },
      });
      if (goldBatch.length >= 250) {
        await Gold.bulkWrite(goldBatch);
        goldUpdated += goldBatch.length;
        goldBatch = [];
      }
    }
    if (goldBatch.length > 0) {
      await Gold.bulkWrite(goldBatch);
      goldUpdated += goldBatch.length;
    }
    console.log(`Updated ${goldUpdated} Gold records.`);

    // 8. MutualFundTrade Backfill
    const mfCursor = MutualFundTrade.find({}).cursor();
    let mfBatch = [];
    let mfUpdated = 0;
    for await (const mf of mfCursor) {
      mfBatch.push({
        updateOne: {
          filter: { _id: mf._id },
          update: {
            $set: {
              priceInPiastres: toPiastres(mf.price),
              feesInPiastres: toPiastres(mf.fees),
              totalValueInPiastres: toPiastres(mf.totalValue),
              deletedAt: mf.deletedAt || null,
            },
          },
        },
      });
      if (mfBatch.length >= 250) {
        await MutualFundTrade.bulkWrite(mfBatch);
        mfUpdated += mfBatch.length;
        mfBatch = [];
      }
    }
    if (mfBatch.length > 0) {
      await MutualFundTrade.bulkWrite(mfBatch);
      mfUpdated += mfBatch.length;
    }
    console.log(`Updated ${mfUpdated} MutualFundTrade records.`);

    // 9. Paycheck Backfill
    const payCursor = Paycheck.find({}).cursor();
    let payBatch = [];
    let payUpdated = 0;
    for await (const p of payCursor) {
      payBatch.push({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              amountInPiastres: toPiastres(p.amount),
              grossAmountInPiastres: toPiastres(p.grossAmount),
              insuranceDeductionInPiastres: toPiastres(p.insuranceDeduction),
              taxDeductionInPiastres: toPiastres(p.taxDeduction),
              deletedAt: p.deletedAt || null,
            },
          },
        },
      });
      if (payBatch.length >= 250) {
        await Paycheck.bulkWrite(payBatch);
        payUpdated += payBatch.length;
        payBatch = [];
      }
    }
    if (payBatch.length > 0) {
      await Paycheck.bulkWrite(payBatch);
      payUpdated += payBatch.length;
    }
    console.log(`Updated ${payUpdated} Paycheck records.`);

    // 10. SalaryProfile Backfill
    const salaryProfiles = await SalaryProfile.find({});
    for (const sp of salaryProfiles) {
      if (Array.isArray(sp.salaryHistory)) {
        for (const sh of sp.salaryHistory) {
          sh.basicSalaryInPiastres = toPiastres(sh.basicSalary);
          sh.basicProductionInPiastres = toPiastres(sh.basicProduction);
          sh.prepaidInPiastres = toPiastres(sh.prepaid);
          sh.variablesInPiastres = toPiastres(sh.variables);
          sh.environmentInPiastres = toPiastres(sh.environment);
          sh.mealInPiastres = toPiastres(sh.meal);
          sh.shiftInPiastres = toPiastres(sh.shift);
          sh.supervisingInPiastres = toPiastres(sh.supervising);
          sh.othersInPiastres = toPiastres(sh.others);
          sh.bondsInPiastres = toPiastres(sh.bonds);
        }
      }
      if (sp.deletedAt === undefined) sp.deletedAt = null;
      await sp.save();
    }
    console.log(`Updated ${salaryProfiles.length} SalaryProfile records.`);

    // 11. SocialInsurance Backfill
    const siList = await SocialInsurance.find({});
    for (const si of siList) {
      si.registeredIncomeInPiastres = toPiastres(si.registeredIncome);
      if (si.deletedAt === undefined) si.deletedAt = null;
      await si.save();
    }
    console.log(`Updated ${siList.length} SocialInsurance records.`);

    // 12. TaxBracket Backfill
    const taxBrackets = await TaxBracket.find({});
    for (const tb of taxBrackets) {
      if (Array.isArray(tb.brackets)) {
        for (const b of tb.brackets) {
          b.fromInPiastres = toPiastres(b.from);
          b.toInPiastres = toPiastres(b.to);
        }
      }
      await tb.save();
    }
    console.log(`Updated ${taxBrackets.length} TaxBracket records.`);

    // 13. Trade Backfill
    const tradeCursor = Trade.find({}).cursor();
    let tradeBatch = [];
    let tradeUpdated = 0;
    for await (const tr of tradeCursor) {
      tradeBatch.push({
        updateOne: {
          filter: { _id: tr._id },
          update: {
            $set: {
              priceInPiastres: toPiastres(tr.price),
              feesInPiastres: toPiastres(tr.fees),
              totalValueInPiastres: toPiastres(tr.totalValue),
              deletedAt: tr.deletedAt || null,
            },
          },
        },
      });
      if (tradeBatch.length >= 250) {
        await Trade.bulkWrite(tradeBatch);
        tradeUpdated += tradeBatch.length;
        tradeBatch = [];
      }
    }
    if (tradeBatch.length > 0) {
      await Trade.bulkWrite(tradeBatch);
      tradeUpdated += tradeBatch.length;
    }
    console.log(`Updated ${tradeUpdated} Trade records.`);

    console.log('--- All Backfills Completed Successfully! ---');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during backfill:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

if (require.main === module) {
  backfillCurrencyPiastres();
}

module.exports = backfillCurrencyPiastres;
