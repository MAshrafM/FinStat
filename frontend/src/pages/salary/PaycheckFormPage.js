// frontend/src/pages/salary/PaycheckFormPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  Building,
  Briefcase,
  Save,
  ArrowLeft,
  RefreshCw,
  Calculator,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Gift,
} from 'lucide-react';
import ComponentTable from '../../components/salary/ComponentTable';
import {
  createPaycheck,
  getPaycheckById,
  updatePaycheck,
  calculatePaycheckPreview,
} from '../../services/paycheckService';
import { getSalaryProfiles } from '../../services/salaryProfileService';
import { getProfile as getLegacyProfile } from '../../services/salaryService';
import { getUserProfile } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import './PaycheckFormPage.css';

const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const sanitizeComponents = (components) => {
  if (!Array.isArray(components)) return [];
  return components
    .filter(c => c && c.name && c.name.trim() !== '')
    .map(c => ({
      ...c,
      name: c.name.trim(),
      value: Number(c.value) || 0,
      category: c.category || 'basic',
      type: c.type || 'fixed',
      calculationBasis: c.calculationBasis || 'gross',
      isTaxable: c.isTaxable !== false,
      isInsurable: c.isInsurable !== false,
      isActive: c.isActive !== false,
    }));
};

const extractProfileSalaryValues = (profileObj) => {
  let basic = 0;
  let production = 0;
  let surplus = 0;
  let sectorBonus = 0;
  let individualBonus = 0;
  let endOfYearBonus = 0;
  let prepaid = 0;
  let bonds = 0;
  let components = [];

  if (!profileObj) {
    return { basic, production, surplus, sectorBonus, individualBonus, endOfYearBonus, prepaid, bonds, components };
  }

  // If passed an array of profiles, pick the default or first one
  const targetObj = Array.isArray(profileObj)
    ? (profileObj.find(p => p && p.isDefault) || profileObj[0] || {})
    : profileObj;

  // 1. Check currentSalary or salaryHistory or direct profile object
  const cur = targetObj.currentSalary || targetObj.salaryHistory?.[0] || targetObj.salaryDetails || targetObj;

  if (cur.basicSalary !== undefined && cur.basicSalary !== null) basic = Number(cur.basicSalary) || 0;
  else if (cur.basicSalaryInPiastres) basic = Number(cur.basicSalaryInPiastres) / 100;

  if (cur.basicProduction !== undefined && cur.basicProduction !== null) production = Number(cur.basicProduction) || 0;
  else if (cur.basicProductionInPiastres) production = Number(cur.basicProductionInPiastres) / 100;

  if (cur.surplus !== undefined && cur.surplus !== null) surplus = Number(cur.surplus) || 0;
  if (cur.sectorBonus !== undefined && cur.sectorBonus !== null) sectorBonus = Number(cur.sectorBonus) || 0;
  if (cur.individualBonus !== undefined && cur.individualBonus !== null) individualBonus = Number(cur.individualBonus) || 0;
  if (cur.endOfYearBonus !== undefined && cur.endOfYearBonus !== null) endOfYearBonus = Number(cur.endOfYearBonus) || 0;
  if (cur.prepaid !== undefined && cur.prepaid !== null) prepaid = Number(cur.prepaid) || 0;
  else if (cur.prepaidInPiastres) prepaid = Number(cur.prepaidInPiastres) / 100;

  if (cur.bonds !== undefined && cur.bonds !== null) bonds = Number(cur.bonds) || 0;
  else if (cur.bondsInPiastres) bonds = Number(cur.bondsInPiastres) / 100;

  // 2. Check components array
  if (Array.isArray(targetObj.components) && targetObj.components.length > 0) {
    components = targetObj.components.map(c => ({
      name: c.name,
      value: Number(c.value) || 0,
      category: c.category || 'basic',
      type: c.type || 'fixed',
      calculationBasis: c.calculationBasis || 'gross',
      isTaxable: c.isTaxable !== false,
      isInsurable: c.isInsurable !== false,
      isActive: c.isActive !== false,
    }));

    const basicComp = components.find(c => c.category === 'basic' || /basic(\s+salary)?/i.test(c.name));
    if (basicComp && (!basic || basicComp.value > 0)) basic = Number(basicComp.value) || 0;

    const prodComp = components.find(c => /production/i.test(c.name));
    if (prodComp && (!production || prodComp.value > 0)) production = Number(prodComp.value) || 0;

    const bondsComp = components.find(c => /bond/i.test(c.name));
    if (bondsComp && (!bonds || bondsComp.value > 0)) bonds = Number(bondsComp.value) || 0;
  }

  // 3. Fallback convert legacy fields if components array was empty
  if (components.length === 0) {
    if (basic > 0) components.push({ name: 'Basic Salary', category: 'basic', type: 'fixed', value: basic, isTaxable: true, isInsurable: true, isActive: true });
    if (production > 0) components.push({ name: 'Basic Production', category: 'bonus', type: 'fixed', value: production, isTaxable: true, isInsurable: false, isActive: true });
    if (cur.variables) components.push({ name: 'Variable Pay', category: 'allowance', type: 'fixed', value: Number(cur.variables) || 0, isTaxable: true, isInsurable: true, isActive: true });
    if (cur.meal) components.push({ name: 'Meal Allowance', category: 'allowance', type: 'fixed', value: Number(cur.meal) || 0, isTaxable: false, isInsurable: false, isActive: true });
    if (cur.environment) components.push({ name: 'Work Environment', category: 'allowance', type: 'fixed', value: Number(cur.environment) || 0, isTaxable: true, isInsurable: false, isActive: true });
    if (cur.shift) components.push({ name: 'Shift Allowance', category: 'allowance', type: 'fixed', value: Number(cur.shift) || 0, isTaxable: true, isInsurable: false, isActive: true });
    if (cur.supervising) components.push({ name: 'Supervising Allowance', category: 'allowance', type: 'fixed', value: Number(cur.supervising) || 0, isTaxable: true, isInsurable: false, isActive: true });
    if (cur.others) components.push({ name: 'Other Allowances', category: 'allowance', type: 'fixed', value: Number(cur.others) || 0, isTaxable: true, isInsurable: false, isActive: true });
  }

  return { basic, production, surplus, sectorBonus, individualBonus, endOfYearBonus, prepaid, bonds, components };
};

const DISBURSEMENT_TYPES = [
  { id: 'Regular', label: 'Regular Paycheck', icon: Briefcase, desc: 'Full monthly salary components (Tax, SI, and Martyrs Fund)', color: '#009879' },
  { id: 'Basic Months', label: 'Basic Months', icon: Calendar, desc: 'Basic salary multiplied by N months with tax deduction', color: '#6366f1' },
  { id: 'Basic Production', label: 'Basic Production', icon: Layers, desc: 'Basic production component multiplied by N months', color: '#8b5cf6' },
  { id: 'Sector Bonus', label: 'Sector Bonus', icon: Building, desc: 'Sector performance bonus with tax deduction', color: '#0284c7' },
  { id: 'Individual Bonus', label: 'Individual Bonus', icon: Award, desc: 'Individual achievement bonus with tax deduction', color: '#ec4899' },
  { id: 'Surplus', label: 'Surplus', icon: TrendingUp, desc: 'Company surplus distribution with tax deduction', color: '#10b981' },
  { id: 'Bond Distribution', label: 'Bond Distribution', icon: Sparkles, desc: 'Bond dividends (Tax-Free & No Insurance)', color: '#d97706' },
  { id: 'End of Year Bonus', label: 'End of Year Bonus', icon: Gift, desc: 'Year-end bonus (Tax-Free, custom deductions allowed)', color: '#f59e0b' },
  { id: 'Prepaid', label: 'Prepaid Advance', icon: CreditCard, desc: 'Mid-month advance (Zero deductions)', color: '#64748b' },
];

const BRACKET_TIERS = [
  { level: 1, name: '0 to 40,000 EGP/yr (0 to 3,333 EGP/mo)', from: 0, to: 40000, rate: 0 },
  { level: 2, name: '40,000 to 55,000 EGP/yr (3,333 to 4,583 EGP/mo)', from: 40000, to: 55000, rate: 10 },
  { level: 3, name: '55,000 to 70,000 EGP/yr (4,583 to 5,833 EGP/mo)', from: 55000, to: 70000, rate: 15 },
  { level: 4, name: '70,000 to 200,000 EGP/yr (5,833 to 16,667 EGP/mo)', from: 70000, to: 200000, rate: 20 },
  { level: 5, name: '200,000 to 400,000 EGP/yr (16,667 to 33,333 EGP/mo)', from: 200000, to: 400000, rate: 22.5 },
  { level: 6, name: '400,000 to 1,200,000 EGP/yr (33,333 to 100,000 EGP/mo)', from: 400000, to: 1200000, rate: 25 },
  { level: 7, name: 'Above 1,200,000 EGP/yr (> 100,000 EGP/mo)', from: 1200000, to: Infinity, rate: 27.5 },
];

// Real-time Cumulative YTD Gross Calculator
const computeLiveEstimate = (components, options = {}) => {
  const sanitized = sanitizeComponents(components);
  const disbursementType = options.disbursementType || 'Regular';
  const multiplier = Number(options.multiplier) > 0 ? Number(options.multiplier) : 1;
  const unitRate = Number(options.unitRate) || 0;
  const priorYtdGross = Math.max(0, Number(options.priorYtdGross) || 0);

  let defaultIncludeTax = true;
  let defaultIncludeInsurance = true;
  let defaultIncludeMartyrsFund = true;

  if (disbursementType === 'Bond Distribution' || disbursementType === 'End of Year Bonus' || disbursementType === 'Prepaid') {
    defaultIncludeTax = false;
    defaultIncludeInsurance = false;
    defaultIncludeMartyrsFund = false;
  } else if (
    disbursementType === 'Basic Months' ||
    disbursementType === 'Basic Production' ||
    disbursementType === 'Sector Bonus' ||
    disbursementType === 'Individual Bonus' ||
    disbursementType === 'Surplus'
  ) {
    defaultIncludeTax = true;
    defaultIncludeInsurance = false;
    defaultIncludeMartyrsFund = false;
  }

  const includeTax = options.includeTax !== undefined ? Boolean(options.includeTax) : defaultIncludeTax;
  const includeInsurance = options.includeInsurance !== undefined ? Boolean(options.includeInsurance) : defaultIncludeInsurance;
  const includeMartyrsFund = options.includeMartyrsFund !== undefined ? Boolean(options.includeMartyrsFund) : defaultIncludeMartyrsFund;

  const basicSalarySum = sanitized
    .filter(c => c.category === 'basic')
    .reduce((sum, c) => sum + (c.value || 0), 0);

  let grossSalary = 0;

  if (disbursementType === 'Basic Months') {
    const base = unitRate > 0 ? unitRate : basicSalarySum;
    grossSalary = Math.round(base * multiplier * 100) / 100;
  } else if (disbursementType === 'Basic Production') {
    const prodBase = unitRate > 0 ? unitRate : basicSalarySum;
    grossSalary = Math.round(prodBase * multiplier * 100) / 100;
  } else if (disbursementType === 'Bond Distribution') {
    grossSalary = Math.round(unitRate * multiplier * 100) / 100;
  } else if (
    disbursementType === 'Sector Bonus' ||
    disbursementType === 'Individual Bonus' ||
    disbursementType === 'Surplus' ||
    disbursementType === 'End of Year Bonus'
  ) {
    grossSalary = unitRate > 0 ? unitRate : sanitized.reduce((s, c) => s + (c.value || 0), 0);
  } else if (disbursementType === 'Prepaid') {
    grossSalary = unitRate > 0 ? unitRate : 0;
  } else {
    grossSalary = sanitized
      .filter(c => c.category !== 'deduction')
      .reduce((sum, c) => sum + (c.value || 0), 0);
  }

  const manualDeductions = sanitized
    .filter(c => c.category === 'deduction')
    .reduce((sum, c) => sum + (c.value || 0), 0);

  const insurableEarnings = sanitized
    .filter(c => c.category !== 'deduction' && c.isInsurable !== false)
    .reduce((sum, c) => sum + (c.value || 0), 0);

  const insurableBase = (includeInsurance && insurableEarnings > 0)
    ? Math.min(Math.max(insurableEarnings, 2700), 16700)
    : 0;
  const expectedInsurance = Math.round(insurableBase * 0.11 * 100) / 100;
  const expectedEmployerInsurance = Math.round(insurableBase * 0.1875 * 100) / 100;

  // Cumulative YTD Gross
  const cumulativeYtdGross = priorYtdGross + grossSalary;

  let matchedTier = BRACKET_TIERS[0];
  for (const tier of BRACKET_TIERS) {
    if (cumulativeYtdGross >= tier.from && (cumulativeYtdGross <= tier.to || tier.to === Infinity)) {
      matchedTier = tier;
      break;
    }
  }

  const appliedRate = includeTax ? matchedTier.rate : 0;
  const expectedTax = includeTax ? Math.round(grossSalary * (appliedRate / 100) * 100) / 100 : 0;
  const martyrsFund = includeMartyrsFund ? Math.round(grossSalary * 0.0005 * 100) / 100 : 0;

  const totalDeductions = Math.round((expectedTax + expectedInsurance + martyrsFund + manualDeductions) * 100) / 100;
  const netPay = Math.round((grossSalary - totalDeductions) * 100) / 100;

  return {
    disbursementType,
    multiplier,
    unitRate,
    grossSalary: Math.round(grossSalary * 100) / 100,
    basicSalary: basicSalarySum,
    taxableIncome: Math.round(grossSalary * 100) / 100,
    priorYtdGross,
    cumulativeYtdGross,
    insurableIncome: insurableBase,
    appliedTaxRate: appliedRate,
    matchedBracket: matchedTier,
    expectedTax,
    includeTax,
    includeInsurance,
    expectedInsurance,
    expectedEmployerInsurance,
    includeMartyrsFund,
    martyrsFund,
    customDeductions: manualDeductions,
    totalDeductions,
    netPay,
    taxDetails: {
      bracketBreakdown: [
        {
          bracket: matchedTier.name,
          rate: appliedRate,
          taxableAmount: Math.round(grossSalary * 100) / 100,
          tax: expectedTax,
          cumulativeYtdGross,
          priorYtdGross,
          isMatched: true,
        },
      ],
    },
  };
};

const PaycheckFormPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [profiles, setProfiles] = useState([]);
  const [profileBasicSalary, setProfileBasicSalary] = useState(0);
  const [profileProductionValue, setProfileProductionValue] = useState(0);
  const [profileBondsCount, setProfileBondsCount] = useState(0);
  const [profileComponents, setProfileComponents] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    type: 'Cash',
    disbursementType: 'Regular',
    period: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    payDate: new Date().toISOString().split('T')[0],
    salaryProfile: '',
    components: [],
    multiplier: 1,
    unitRate: 0,
    priorYtdGross: 0,
    includeTax: true,
    includeInsurance: true,
    includeMartyrsFund: true,
    // Manual Overrides (allows direct entry of exact payslip numbers)
    manualGross: '',
    manualTax: '',
    manualInsurance: '',
    manualOtherDeductions: '',
    manualNetPay: '',
    notes: '',
  });

  const [previewResult, setPreviewResult] = useState(() => computeLiveEstimate([]));

  // Trigger calculation from backend (with live estimate fallback)
  const triggerCalculation = useCallback(async (periodVal, componentsVal, silent = false, overrideOptions = {}) => {
    const periodToUse = periodVal || formData.period || new Date().toISOString().slice(0, 7);
    const sanitized = sanitizeComponents(componentsVal !== undefined ? componentsVal : formData.components);
    const rawRate = overrideOptions.unitRate !== undefined ? overrideOptions.unitRate : formData.unitRate;
    const sanitizedUnitRate = (rawRate === '' || rawRate === null || rawRate === undefined) ? 0 : (Number(rawRate) || 0);
    const rawMult = overrideOptions.multiplier !== undefined ? overrideOptions.multiplier : formData.multiplier;
    const sanitizedMultiplier = (rawMult === '' || rawMult === null || rawMult === undefined) ? 1 : (Number(rawMult) || 1);

    const opts = {
      disbursementType: formData.disbursementType,
      includeTax: formData.includeTax,
      includeInsurance: formData.includeInsurance,
      includeMartyrsFund: formData.includeMartyrsFund,
      paycheckId: isEditMode ? id : undefined,
      ...overrideOptions,
      multiplier: sanitizedMultiplier,
      unitRate: sanitizedUnitRate,
    };

    // Immediately calculate local preview so UI updates without lag
    const localEst = computeLiveEstimate(sanitized, { ...opts, priorYtdGross: formData.priorYtdGross });
    setPreviewResult(localEst);

    try {
      setCalculating(true);
      const res = await calculatePaycheckPreview({
        period: periodToUse,
        components: sanitized,
        ...opts,
      });

      if (res && res.preview) {
        setPreviewResult(res.preview);
        if (res.preview.priorYtdGross !== undefined) {
          setFormData(prev => ({ ...prev, priorYtdGross: res.preview.priorYtdGross }));
        }
        if (!silent && notify) {
          notify('Live tax and deductions preview updated successfully!', 'success');
        }
      }
    } catch (err) {
      if (!silent && notify) {
        notify('Calculated with YTD cumulative gross model', 'info');
      }
    } finally {
      setCalculating(false);
    }
  }, [formData, isEditMode, id, notify]);

  // Handle Disbursement Type Change with User Profile Auto-Pull
  const handleDisbursementTypeChange = (typeId) => {
    let incTax = true;
    let incIns = true;
    let incMartyrs = true;
    let defaultRate = 0;
    let defaultMult = 1;
    let compsToUse = formData.components;

    if (typeId === 'Bond Distribution' || typeId === 'End of Year Bonus' || typeId === 'Prepaid') {
      incTax = false;
      incIns = false;
      incMartyrs = false;
    } else if (
      typeId === 'Basic Months' ||
      typeId === 'Basic Production' ||
      typeId === 'Sector Bonus' ||
      typeId === 'Individual Bonus' ||
      typeId === 'Surplus'
    ) {
      incTax = true;
      incIns = false;
      incMartyrs = false;
    }

    if (typeId === 'Regular') {
      compsToUse = profileComponents.length > 0 ? profileComponents : formData.components;
      defaultRate = profileBasicSalary;
      defaultMult = 1;
    } else if (typeId === 'Basic Months') {
      defaultRate = profileBasicSalary || 0;
      defaultMult = 1;
    } else if (typeId === 'Basic Production') {
      defaultRate = profileProductionValue || 0;
      defaultMult = 1;
    } else if (typeId === 'Bond Distribution') {
      defaultRate = 10;
      defaultMult = profileBondsCount || 0;
    } else {
      // Sector Bonus, Individual Bonus, Surplus, End of Year Bonus, Prepaid (ad-hoc payouts entered by user)
      defaultRate = '';
      defaultMult = 1;
    }

    const updated = {
      ...formData,
      disbursementType: typeId,
      type: typeId === 'Prepaid' ? 'Prepaid' : 'Cash',
      components: compsToUse,
      includeTax: incTax,
      includeInsurance: incIns,
      includeMartyrsFund: incMartyrs,
      unitRate: defaultRate,
      multiplier: defaultMult,
      manualGross: '',
      manualTax: '',
      manualInsurance: '',
      manualOtherDeductions: '',
      manualNetPay: '',
    };
    setFormData(updated);
    triggerCalculation(formData.period, compsToUse, true, updated);
  };

  // Fetch initial profile and existing paycheck (if edit mode)
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingInitial(true);
        let initialComps = [];
        let initialPeriod = new Date().toISOString().slice(0, 7);

        let activeProfile = null;
        let loadedProfiles = [];

        // 1. Try getSalaryProfiles()
        try {
          const multiRes = await getSalaryProfiles();
          if (multiRes) {
            if (Array.isArray(multiRes.profiles) && multiRes.profiles.length > 0) {
              loadedProfiles = multiRes.profiles;
              activeProfile = loadedProfiles.find(p => p.isDefault) || loadedProfiles[0];
            } else if (Array.isArray(multiRes) && multiRes.length > 0) {
              loadedProfiles = multiRes;
              activeProfile = loadedProfiles.find(p => p.isDefault) || loadedProfiles[0];
            } else if (multiRes.mainProfile) {
              activeProfile = multiRes.mainProfile;
            }
          }
        } catch (ignored) {}

        // 2. Try legacy getProfile()
        if (!activeProfile) {
          try {
            const legacyRes = await getLegacyProfile();
            if (legacyRes) {
              activeProfile = legacyRes.mainProfile || (legacyRes.profiles && legacyRes.profiles[0]) || legacyRes;
            }
          } catch (ignored) {}
        }

        // 3. Try getUserProfile()
        if (!activeProfile) {
          try {
            const userProf = await getUserProfile();
            const u = userProf?.user || userProf;
            if (u && (u.salaryProfile || u.currentSalary)) {
              activeProfile = u.salaryProfile || u;
            }
          } catch (ignored) {}
        }

        if (loadedProfiles.length > 0) {
          setProfiles(loadedProfiles);
        }

        // Extract values from whichever profile source resolved
        if (activeProfile) {
          const extracted = extractProfileSalaryValues(activeProfile);
          if (extracted.basic > 0) setProfileBasicSalary(extracted.basic);
          if (extracted.production > 0) setProfileProductionValue(extracted.production);
          if (extracted.bonds > 0) setProfileBondsCount(extracted.bonds);
          if (extracted.components.length > 0) {
            initialComps = extracted.components;
            setProfileComponents(extracted.components);
          }

          if (!isEditMode) {
            setSelectedProfileId(activeProfile._id || '');
            const initialUnitRate = extracted.basic > 0 ? extracted.basic : 0;
            setFormData(prev => ({
              ...prev,
              salaryProfile: activeProfile._id || '',
              components: initialComps,
              unitRate: initialUnitRate,
            }));
            triggerCalculation(initialPeriod, initialComps, true, {
              salaryProfile: activeProfile._id || '',
              components: initialComps,
              unitRate: initialUnitRate,
            });
          }
        }

        if (isEditMode) {
          const pc = await getPaycheckById(id);
          if (pc) {
            initialPeriod = pc.period || pc.month || initialPeriod;
            const grossVal = pc.grossSalary !== undefined ? pc.grossSalary : (pc.grossAmount || pc.amount || 0);
            const netVal = pc.netPay !== undefined ? pc.netPay : (pc.amount || 0);
            const taxVal = pc.taxDeduction || pc.taxDetails?.actualTax || pc.taxDetails?.expectedTax || 0;
            const insVal = pc.insuranceDeduction || pc.insuranceDetails?.actualEmployeeShare || pc.insuranceDetails?.expectedEmployeeShare || 0;

            const editFormState = {
              type: pc.type || (pc.disbursementType === 'Prepaid' ? 'Prepaid' : 'Cash'),
              disbursementType: pc.disbursementType || 'Regular',
              period: initialPeriod,
              payDate: pc.payDate ? new Date(pc.payDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              salaryProfile: pc.salaryProfile?._id || pc.salaryProfile || '',
              components: pc.components && pc.components.length > 0 ? pc.components : initialComps,
              multiplier: pc.multiplier || 1,
              unitRate: pc.unitRate || grossVal || 0,
              priorYtdGross: pc.priorYtdGross || 0,
              includeTax: pc.includeTax !== false,
              includeInsurance: pc.includeInsurance !== false,
              includeMartyrsFund: pc.includeMartyrsFund !== false,
              manualGross: grossVal ? String(grossVal) : '',
              manualTax: taxVal ? String(taxVal) : '',
              manualInsurance: insVal ? String(insVal) : '',
              manualOtherDeductions: pc.martyrsFund ? String(pc.martyrsFund) : '',
              manualNetPay: netVal ? String(netVal) : '',
              notes: pc.notes || pc.note || '',
            };
            setFormData(editFormState);
            triggerCalculation(initialPeriod, editFormState.components, true, editFormState);
          }
        }
      } catch (err) {
        console.error('Error initializing paycheck form:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const activeResult = previewResult || computeLiveEstimate(formData.components, formData);

  // Compute effective final values (manual inputs take precedence over live calculations)
  const effectiveGross = formData.manualGross !== '' ? Number(formData.manualGross) : activeResult.grossSalary;
  const effectiveTax = formData.manualTax !== '' ? Number(formData.manualTax) : activeResult.expectedTax;
  const effectiveIns = formData.manualInsurance !== '' ? Number(formData.manualInsurance) : activeResult.expectedInsurance;
  const effectiveOtherDeductions = formData.manualOtherDeductions !== '' ? Number(formData.manualOtherDeductions) : (activeResult.martyrsFund + activeResult.customDeductions);
  const calculatedNet = effectiveGross - effectiveTax - effectiveIns - effectiveOtherDeductions;
  const effectiveNet = formData.manualNetPay !== '' ? Number(formData.manualNetPay) : calculatedNet;
  const effectiveTotalDeductions = effectiveGross - effectiveNet;

  // Sync calculator values into manual fields
  const handleSyncFromCalculator = () => {
    setFormData(prev => ({
      ...prev,
      manualGross: String(activeResult.grossSalary),
      manualTax: String(activeResult.expectedTax),
      manualInsurance: String(activeResult.expectedInsurance),
      manualOtherDeductions: String(activeResult.martyrsFund + activeResult.customDeductions),
      manualNetPay: String(activeResult.netPay),
    }));
    if (notify) notify('Synced calculated numbers into manual entries!', 'success');
  };

  // Form Submission
  const handleSavePaycheck = async (e) => {
    e.preventDefault();

    if (!formData.period) {
      if (notify) notify('Please provide a pay period (e.g. 2026-08)', 'error');
      return;
    }

    const payload = {
      type: formData.disbursementType === 'Prepaid' ? 'Prepaid' : 'Cash',
      disbursementType: formData.disbursementType,
      period: formData.period,
      month: formData.period,
      payDate: formData.payDate,
      date: formData.payDate,
      salaryProfile: formData.salaryProfile || undefined,
      multiplier: formData.multiplier,
      unitRate: Number(formData.unitRate) || 0,
      priorYtdGross: activeResult.priorYtdGross,
      cumulativeYtdGross: activeResult.cumulativeYtdGross,
      appliedTaxRate: activeResult.appliedTaxRate,
      includeTax: formData.includeTax,
      includeInsurance: formData.includeInsurance,
      includeMartyrsFund: formData.includeMartyrsFund,
      components: sanitizeComponents(formData.components),
      grossSalary: effectiveGross,
      grossAmount: effectiveGross,
      totalDeductions: effectiveTotalDeductions,
      netPay: effectiveNet,
      amount: effectiveNet,
      taxDeduction: effectiveTax,
      insuranceDeduction: effectiveIns,
      martyrsFund: activeResult.martyrsFund,
      taxDetails: {
        taxableIncome: activeResult.taxableIncome,
        expectedTax: activeResult.expectedTax,
        actualTax: effectiveTax,
        actualGross: effectiveGross,
        taxBracketApplied: `${activeResult.appliedTaxRate}% (YTD: ${formatCurrency(activeResult.cumulativeYtdGross)})`,
      },
      insuranceDetails: {
        insurableIncome: activeResult.insurableIncome,
        expectedEmployeeShare: activeResult.expectedInsurance,
        actualEmployeeShare: effectiveIns,
        expectedEmployerShare: activeResult.expectedEmployerInsurance,
        actualEmployerShare: activeResult.expectedEmployerInsurance,
      },
      notes: formData.notes || undefined,
      note: formData.notes || undefined,
    };

    try {
      setSaving(true);
      if (isEditMode) {
        await updatePaycheck(id, payload);
        if (notify) notify('Paycheck record updated successfully!', 'success');
      } else {
        await createPaycheck(payload);
        if (notify) notify(`${formData.disbursementType} logged successfully!`, 'success');
      }
      navigate('/paycheck-log');
    } catch (err) {
      if (notify) notify(err.response?.data?.message || 'Failed to save paycheck', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <RefreshCw className="spinning-icon" size={32} style={{ color: '#009879', marginBottom: '1rem' }} />
        <p style={{ color: '#6c757d' }}>Loading profile & paycheck details...</p>
      </div>
    );
  }

  // Get auto-pulled value text for Section 2
  const getDisbursementProfileRefText = () => {
    switch (formData.disbursementType) {
      case 'Regular':
        return `Profile Components Loaded (${profileComponents.length} items)`;
      case 'Basic Months':
        return `Auto-pulled from Profile Basic Salary: ${formatCurrency(profileBasicSalary)}`;
      case 'Basic Production':
        return `Auto-pulled from Profile Basic Production: ${formatCurrency(profileProductionValue)}`;
      case 'Bond Distribution':
        return `Auto-pulled from Profile Bonds Held: ${profileBondsCount} bonds`;
      default:
        return 'Enter ad-hoc payout amount (EGP)';
    }
  };

  return (
    <div className="page-container">
      <div className="paycheck-form-header">
        <button className="back-btn" onClick={() => navigate('/paycheck-log')}>
          <ArrowLeft size={16} /> Back to Paycheck Log
        </button>
        <h1 className="form-main-title">{isEditMode ? 'Edit Paycheck Record' : 'Paycheck Calculator & Entry'}</h1>
        <p className="form-main-subtitle">
          Log standard monthly salaries, multi-month basic pay, production bonuses, surplus, or tax-free bond dividends
        </p>
      </div>

      {/* DISBURSEMENT TYPE SELECTOR GRID */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Select Disbursement Type:
          </label>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Profile Basic: <strong>{formatCurrency(profileBasicSalary)}</strong> | Production: <strong>{formatCurrency(profileProductionValue)}</strong> | Bonds: <strong>{profileBondsCount}</strong>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {DISBURSEMENT_TYPES.map((dt) => {
            const IconComp = dt.icon;
            const isSelected = formData.disbursementType === dt.id;
            return (
              <button
                key={dt.id}
                type="button"
                onClick={() => handleDisbursementTypeChange(dt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${dt.color}` : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                  boxShadow: isSelected ? `0 0 0 1px ${dt.color}20, 0 4px 6px -1px rgba(0,0,0,0.05)` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  backgroundColor: `${dt.color}15`,
                  color: dt.color,
                  padding: '6px',
                  borderRadius: '8px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  <IconComp size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? dt.color : '#1e293b' }}>
                    {dt.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', lineHeight: '1.25' }}>
                    {dt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSavePaycheck} className="paycheck-flow-layout">
        {/* STEP 1: Basic Period & Pay Date */}
        <div className="form-step-card">
          <div className="step-card-header">
            <span className="step-number-badge">1</span>
            <div>
              <h3 className="step-card-title">Disbursement Period & Date</h3>
              <p className="step-card-desc">Assign the pay period and disbursement date for accurate YTD tax bracket progression</p>
            </div>
          </div>

          <div className="step-fields-grid">
            <div className="form-group">
              <label className="form-label">Pay Period (YYYY-MM) *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 2026-08 or August 2026"
                value={formData.period}
                onChange={(e) => {
                  const newPeriod = e.target.value;
                  setFormData({ ...formData, period: newPeriod });
                  triggerCalculation(newPeriod, formData.components, true);
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Disbursement Date *</label>
              <input
                type="date"
                className="form-control"
                value={formData.payDate}
                onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                required
              />
            </div>

            {formData.disbursementType === 'Regular' && profiles.length > 0 && (
              <div className="form-group full-span">
                <label className="form-label">Load Template from Salary Profile</label>
                <select
                  className="form-control"
                  value={selectedProfileId}
                  onChange={(e) => {
                    const profId = e.target.value;
                    setSelectedProfileId(profId);
                    const chosen = profiles.find(p => p._id === profId);
                    if (chosen) {
                      const extracted = extractProfileSalaryValues(chosen);
                      setFormData(prev => ({ ...prev, salaryProfile: profId, components: extracted.components }));
                      triggerCalculation(formData.period, extracted.components, true);
                    }
                  }}
                >
                  <option value="">-- Choose a Profile Template --</option>
                  {profiles.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: DYNAMIC EARNINGS INPUTS */}
        <div className="form-step-card">
          <div className="step-card-header">
            <span className="step-number-badge">2</span>
            <div>
              <h3 className="step-card-title">{formData.disbursementType} Inputs & Calculation Basis</h3>
              <p className="step-card-desc">
                {formData.disbursementType === 'Regular' || formData.disbursementType === 'Basic Months' || formData.disbursementType === 'Basic Production' || formData.disbursementType === 'Bond Distribution'
                  ? 'Auto-populated directly from your active user profile'
                  : 'Enter the ad-hoc lump sum payout amount'}
              </p>
            </div>
          </div>

          {/* Dedicated Input Flow per Disbursement Type */}
          {formData.disbursementType === 'Basic Months' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Basic Salary per Month (EGP) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.unitRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({ ...formData, unitRate: val });
                    triggerCalculation(formData.period, formData.components, true, { unitRate: val });
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{getDisbursementProfileRefText()}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Months (Multiplier) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.multiplier}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setFormData({ ...formData, multiplier: val });
                    triggerCalculation(formData.period, formData.components, true, { multiplier: val });
                  }}
                  placeholder="e.g. 1, 1.5, 2, 3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Calculated Base Gross (EGP)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontWeight: 700, color: '#6366f1', backgroundColor: '#f1f5f9' }}
                  value={formatCurrency(activeResult.grossSalary)}
                  readOnly
                />
              </div>
            </div>
          )}

          {formData.disbursementType === 'Basic Production' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Basic Production Component Base (EGP) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.unitRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({ ...formData, unitRate: val });
                    triggerCalculation(formData.period, formData.components, true, { unitRate: val });
                  }}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{getDisbursementProfileRefText()}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Production Multiplier (Months) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.multiplier}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setFormData({ ...formData, multiplier: val });
                    triggerCalculation(formData.period, formData.components, true, { multiplier: val });
                  }}
                  placeholder="e.g. 1, 1.5, 2"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Calculated Base Gross (EGP)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontWeight: 700, color: '#8b5cf6', backgroundColor: '#f1f5f9' }}
                  value={formatCurrency(activeResult.grossSalary)}
                  readOnly
                />
              </div>
            </div>
          )}

          {formData.disbursementType === 'Bond Distribution' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Number of Bonds Held *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.multiplier}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({ ...formData, multiplier: val });
                    triggerCalculation(formData.period, formData.components, true, { multiplier: val });
                  }}
                  placeholder="e.g. 500"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{getDisbursementProfileRefText()}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Distribution Rate per Bond (EGP) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={formData.unitRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({ ...formData, unitRate: val });
                    triggerCalculation(formData.period, formData.components, true, { unitRate: val });
                  }}
                  placeholder="e.g. 10.00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Distribution Payout (EGP)</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontWeight: 700, color: '#10b981', backgroundColor: '#f1f5f9' }}
                  value={formatCurrency(activeResult.grossSalary)}
                  readOnly
                />
              </div>
            </div>
          )}

          {(formData.disbursementType === 'Sector Bonus' ||
            formData.disbursementType === 'Individual Bonus' ||
            formData.disbursementType === 'Surplus' ||
            formData.disbursementType === 'End of Year Bonus' ||
            formData.disbursementType === 'Prepaid') && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">{formData.disbursementType} Amount (EGP) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0284c7' }}
                  value={formData.unitRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({ ...formData, unitRate: val });
                    triggerCalculation(formData.period, formData.components, true, { unitRate: val });
                  }}
                  placeholder="e.g. 25000"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Enter ad-hoc {formData.disbursementType} amount for this period
                </span>
              </div>
            </div>
          )}

          {formData.disbursementType === 'Regular' && (
            <ComponentTable
              components={formData.components}
              onChange={(newComps) => {
                setFormData({ ...formData, components: newComps });
                triggerCalculation(formData.period, newComps, true);
              }}
              readOnly={false}
            />
          )}

          {/* DEDUCTION TOGGLES */}
          <div className="calculate-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={formData.includeTax !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, includeTax: val });
                    triggerCalculation(formData.period, formData.components, false, { includeTax: val });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#009879', cursor: 'pointer' }}
                />
                Apply Income Tax Bracket
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={formData.includeInsurance !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, includeInsurance: val });
                    triggerCalculation(formData.period, formData.components, false, { includeInsurance: val });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#009879', cursor: 'pointer' }}
                />
                Social Insurance (11%)
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={formData.includeMartyrsFund !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, includeMartyrsFund: val });
                    triggerCalculation(formData.period, formData.components, false, { includeMartyrsFund: val });
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#009879', cursor: 'pointer' }}
                />
                Martyrs Fund (0.05%)
              </label>
            </div>

            <button
              type="button"
              className="btn-calculate-preview"
              onClick={() => triggerCalculation(formData.period, formData.components, false)}
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <RefreshCw className="spinning-icon" size={16} />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Calculator size={16} />
                  <span>Recalculate Estimate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* STEP 3: LIVE YTD CUMULATIVE GROSS TRACKER & ESTIMATE */}
        <div className="form-step-card smart-preview-card" id="step-3-preview-section">
          <div className="step-card-header">
            <span className="step-number-badge preview-badge">3</span>
            <div style={{ flex: 1 }}>
              <h3 className="step-card-title">Live Cumulative YTD Tracker & Statutory Rates</h3>
              <p className="step-card-desc">Tracks year-to-date gross progression and suggests calculated statutory brackets</p>
            </div>
            {calculating && (
              <span style={{ fontSize: '0.85rem', color: '#009879', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={14} className="spinning-icon" /> Calculating...
              </span>
            )}
          </div>

          {/* YTD PROGRESS BANNER */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Prior YTD Gross in Year</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#475569' }}>
                {formatCurrency(activeResult.priorYtdGross || 0)}
              </div>
            </div>

            <div style={{ fontSize: '1.5rem', color: '#cbd5e1', fontWeight: 300 }}>+</div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Current Payout Gross</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#009879' }}>
                {formatCurrency(effectiveGross)}
              </div>
            </div>

            <div style={{ fontSize: '1.5rem', color: '#cbd5e1', fontWeight: 300 }}>=</div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem 1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>New Cumulative YTD Gross</span>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#166534' }}>
                {formatCurrency((activeResult.priorYtdGross || 0) + effectiveGross)}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                {formData.includeTax !== false
                  ? `Matched Bracket: ${activeResult.appliedTaxRate}% Tax Rate`
                  : 'Tax Exempt for this Payout'}
              </span>
            </div>
          </div>

          {/* Figures Comparison Grid */}
          <div className="preview-summary-figures">
            <div className="preview-stat-card">
              <div className="stat-header-row">
                <span className="stat-title">Suggested Gross</span>
              </div>
              <div className="stat-amount gross-color">{formatCurrency(activeResult.grossSalary)}</div>
              <div className="stat-subtext">{formData.disbursementType}</div>
            </div>

            <div className="preview-stat-card">
              <div className="stat-header-row">
                <span className="stat-title">Suggested Tax ({activeResult.appliedTaxRate}%)</span>
              </div>
              <div className="stat-amount deduction-color">{formatCurrency(activeResult.expectedTax)}</div>
              <div className="stat-subtext">Flat bracket on gross</div>
            </div>

            <div className="preview-stat-card">
              <div className="stat-header-row">
                <span className="stat-title">Social Insurance</span>
              </div>
              <div className="stat-amount deduction-color">{formatCurrency(activeResult.expectedInsurance)}</div>
              <div className="stat-subtext">{formData.includeInsurance ? '11% Insurable Base' : '0.00 EGP (Off)'}</div>
            </div>

            <div className="preview-stat-card highlight-card">
              <div className="stat-header-row">
                <span className="stat-title">Suggested Net Pay</span>
              </div>
              <div className="stat-amount net-color">{formatCurrency(activeResult.netPay)}</div>
              <div className="stat-subtext">Total Ded: {formatCurrency(activeResult.totalDeductions)}</div>
            </div>
          </div>
        </div>

        {/* STEP 4: MANUAL DIRECT ENTRY & DISCREPANCY OVERRIDE */}
        <div className="form-step-card" style={{ border: '2px solid #e0e7ff', backgroundColor: '#fdfefe' }}>
          <div className="step-card-header">
            <span className="step-number-badge" style={{ backgroundColor: '#4f46e5' }}>4</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 className="step-card-title">Manual Entries & Exact Payslip Numbers</h3>
                <button
                  type="button"
                  onClick={handleSyncFromCalculator}
                  style={{
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    border: '1px solid #c7d2fe',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={13} /> Sync from Calculator
                </button>
              </div>
              <p className="step-card-desc">
                Type the exact numbers from your payslip if they differ from statutory suggestions.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                Gross Payout (EGP) *
              </label>
              <input
                type="number"
                step="any"
                className="form-control"
                style={{ fontSize: '1.05rem', fontWeight: 700, color: '#009879' }}
                placeholder={String(activeResult.grossSalary)}
                value={formData.manualGross}
                onChange={(e) => setFormData({ ...formData, manualGross: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Suggested: {formatCurrency(activeResult.grossSalary)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                Tax Deducted (EGP)
              </label>
              <input
                type="number"
                step="any"
                className="form-control"
                style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e11d48' }}
                placeholder={String(activeResult.expectedTax)}
                value={formData.manualTax}
                onChange={(e) => setFormData({ ...formData, manualTax: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Suggested: {formatCurrency(activeResult.expectedTax)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                Social Insurance Deducted (EGP)
              </label>
              <input
                type="number"
                step="any"
                className="form-control"
                style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e11d48' }}
                placeholder={String(activeResult.expectedInsurance)}
                value={formData.manualInsurance}
                onChange={(e) => setFormData({ ...formData, manualInsurance: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Suggested: {formatCurrency(activeResult.expectedInsurance)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                Other Deductions / Fund (EGP)
              </label>
              <input
                type="number"
                step="any"
                className="form-control"
                style={{ fontSize: '1.05rem', fontWeight: 600, color: '#e11d48' }}
                placeholder={String(activeResult.martyrsFund + activeResult.customDeductions)}
                value={formData.manualOtherDeductions}
                onChange={(e) => setFormData({ ...formData, manualOtherDeductions: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Fund/Misc: {formatCurrency(activeResult.martyrsFund + activeResult.customDeductions)}</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, color: '#0f766e' }}>
                Final Net Disbursed (EGP) *
              </label>
              <input
                type="number"
                step="any"
                className="form-control"
                style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f766e', backgroundColor: '#f0fdfa', borderColor: '#5eead4' }}
                placeholder={String(effectiveNet)}
                value={formData.manualNetPay}
                onChange={(e) => setFormData({ ...formData, manualNetPay: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: '#0f766e' }}>Calculated Net: {formatCurrency(calculatedNet)}</span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Disbursement Notes / Audit Memo</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder={`e.g. ${formData.disbursementType} payout for ${formData.period}`}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* HIGH-VISIBILITY LOG SUBMIT CTA BUTTON */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Ready to record in ledger:
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                {formData.disbursementType} {formData.multiplier > 1 ? `(${formData.multiplier}x)` : ''} — <span style={{ color: '#009879' }}>{formatCurrency(effectiveNet)} Net</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Gross: {formatCurrency(effectiveGross)} | Total Deductions: {formatCurrency(effectiveTotalDeductions)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/paycheck-log')}
                disabled={saving}
                style={{
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.9rem 2rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #009879 0%, #059669 100%)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 152, 121, 0.35)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw className="spinning-icon" size={20} />
                    <span>Saving to Ledger...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>{isEditMode ? 'Update Paycheck Record' : `Save & Log ${formData.disbursementType}`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaycheckFormPage;
