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

export const normalizePayDateInput = (val) => {
  if (!val) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      return `${val.slice(0, 10)}T12:00:00.000Z`;
    }
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T12:00:00.000Z`;
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T12:00:00.000Z`;
};

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
  { id: 'Regular', label: 'Regular Paycheck', icon: Briefcase, desc: 'Full monthly salary components (Tax, SI, and Martyrs Fund)' },
  { id: 'Basic Months', label: 'Basic Months', icon: Calendar, desc: 'Basic salary multiplied by N months with tax deduction' },
  { id: 'Basic Production', label: 'Basic Production', icon: Layers, desc: 'Basic production component multiplied by N months' },
  { id: 'Sector Bonus', label: 'Sector Bonus', icon: Building, desc: 'Sector performance bonus with tax deduction' },
  { id: 'Individual Bonus', label: 'Individual Bonus', icon: Award, desc: 'Individual achievement bonus with tax deduction' },
  { id: 'Surplus', label: 'Surplus', icon: TrendingUp, desc: 'Company surplus distribution with tax deduction' },
  { id: 'Bond Distribution', label: 'Bond Distribution', icon: Sparkles, desc: 'Bond dividends (Tax-Free & No Insurance)' },
  { id: 'End of Year Bonus', label: 'End of Year Bonus', icon: Gift, desc: 'Year-end bonus (Tax-Free, custom deductions allowed)' },
  { id: 'Prepaid', label: 'Prepaid Advance', icon: CreditCard, desc: 'Mid-month advance (Zero deductions)' },
];

// Baseline Component Sums & Fallback Estimator
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

  // Cumulative YTD Gross
  const cumulativeYtdGross = priorYtdGross + grossSalary;

  // Local baseline returns structural sums and flags isLocalFallback: true
  // Statutory progressive tax and social insurance are authoritative only from /api/paychecks/preview
  return {
    disbursementType,
    multiplier,
    unitRate,
    grossSalary: Math.round(grossSalary * 100) / 100,
    basicSalary: basicSalarySum,
    taxableIncome: Math.round(grossSalary * 100) / 100,
    priorYtdGross,
    cumulativeYtdGross,
    insurableIncome: 0,
    appliedTaxRate: 0,
    matchedBracket: null,
    expectedTax: 0,
    includeTax,
    includeInsurance,
    expectedInsurance: 0,
    expectedEmployerInsurance: 0,
    includeMartyrsFund,
    martyrsFund: 0,
    customDeductions: manualDeductions,
    totalDeductions: manualDeductions,
    netPay: Math.round((grossSalary - manualDeductions) * 100) / 100,
    isLocalFallback: true,
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
    destinationAccount: 'Bank',
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
  const [previewError, setPreviewError] = useState(null);

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

    setPreviewError(null);
    setCalculating(true);

    try {
      const res = await calculatePaycheckPreview({
        period: periodToUse,
        components: sanitized,
        ...opts,
      });

      if (res && res.preview) {
        setPreviewResult(res.preview);
        setPreviewError(null);
        if (res.preview.priorYtdGross !== undefined) {
          setFormData(prev => ({ ...prev, priorYtdGross: res.preview.priorYtdGross }));
        }
        if (!silent && notify) {
          notify('Live tax and deductions preview updated successfully!', 'success');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Statutory calculation service temporarily unavailable';
      setPreviewError(errorMsg);
      const fallbackEst = computeLiveEstimate(sanitized, { ...opts, priorYtdGross: formData.priorYtdGross });
      setPreviewResult(fallbackEst);
      if (!silent && notify) {
        notify(`Calculation warning: ${errorMsg}`, 'error');
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

    const normalizedPayDate = normalizePayDateInput(formData.payDate);
        const payload = {
      type: formData.disbursementType === 'Prepaid' ? 'Prepaid' : 'Cash',
      disbursementType: formData.disbursementType,
      destinationAccount: formData.destinationAccount || 'Bank',
      period: formData.period,
      month: formData.period,
      payDate: normalizedPayDate,
      date: normalizedPayDate,
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
      <div className="page-container paycheck-loading-container">
        <RefreshCw className="spinning-icon paycheck-loading-icon" size={32} />
        <p className="paycheck-loading-text">Loading profile & paycheck details...</p>
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
      <div className="paycheck-type-section">
        <div className="paycheck-type-header-row">
          <span className="paycheck-type-label">
            Select Disbursement Type:
          </span>
          <span className="paycheck-profile-ref-summary">
            Profile Basic: <strong>{formatCurrency(profileBasicSalary)}</strong> | Production: <strong>{formatCurrency(profileProductionValue)}</strong> | Bonds: <strong>{profileBondsCount}</strong>
          </span>
        </div>
        <div className="paycheck-type-grid">
          {DISBURSEMENT_TYPES.map((dt) => {
            const IconComp = dt.icon;
            const isSelected = formData.disbursementType === dt.id;
            const typeClass = `type-${dt.id.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <button
                key={dt.id}
                type="button"
                onClick={() => handleDisbursementTypeChange(dt.id)}
                className={`paycheck-type-btn ${typeClass} ${isSelected ? 'selected' : ''}`}
              >
                <div className="paycheck-type-icon-wrapper">
                  <IconComp size={18} />
                </div>
                <div>
                  <div className="paycheck-type-title">
                    {dt.label}
                  </div>
                  <div className="paycheck-type-desc">
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
              <h2 className="step-card-title">Disbursement Period & Date</h2>
              <p className="step-card-desc">Assign the pay period and disbursement date for accurate YTD tax bracket progression</p>
            </div>
          </div>

          <div className="step-fields-grid">
            <div className="form-group">
              <label htmlFor="pay-period" className="form-label">Pay Period (YYYY-MM) *</label>
              <input
                id="pay-period"
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
              <label htmlFor="pay-date" className="form-label">Disbursement Date *</label>
              <input
                id="pay-date"
                type="date"
                className="form-control"
                value={formData.payDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    payDate: newDate,
                    period: newDate ? newDate.slice(0, 7) : prev.period,
                  }));
                }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="destination-account" className="form-label">Deposit To Account</label>
              <select
                id="destination-account"
                className="form-control"
                value={formData.destinationAccount || 'Bank'}
                onChange={(e) => setFormData({ ...formData, destinationAccount: e.target.value })}
              >
                <option value="Bank">Bank Account</option>
                <option value="Cash">Cash Ledger</option>
                <option value="Prepaid">Prepaid Card</option>
              </select>
            </div>

            {formData.disbursementType === 'Regular' && profiles.length > 0 && (
              <div className="form-group full-span">
                <label htmlFor="salary-profile" className="form-label">Load Template from Salary Profile</label>
                <select
                  id="salary-profile"
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
              <h2 className="step-card-title">{formData.disbursementType} Inputs & Calculation Basis</h2>
              <p className="step-card-desc">
                {formData.disbursementType === 'Regular' || formData.disbursementType === 'Basic Months' || formData.disbursementType === 'Basic Production' || formData.disbursementType === 'Bond Distribution'
                  ? 'Auto-populated directly from your active user profile'
                  : 'Enter the ad-hoc lump sum payout amount'}
              </p>
            </div>
          </div>

          {/* Dedicated Input Flow per Disbursement Type */}
          {formData.disbursementType === 'Basic Months' && (
            <div className="paycheck-input-grid">
              <div className="form-group">
                <label htmlFor="basic-salary" className="form-label">Basic Salary per Month (EGP) *</label>
                <input
                  id="basic-salary"
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
                <span className="paycheck-profile-ref-text">{getDisbursementProfileRefText()}</span>
              </div>

              <div className="form-group">
                <label htmlFor="basic-months-multiplier" className="form-label">Number of Months (Multiplier) *</label>
                <input
                  id="basic-months-multiplier"
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
                <label htmlFor="basic-months-calc-gross" className="form-label">Calculated Base Gross (EGP)</label>
                <input
                  id="basic-months-calc-gross"
                  type="text"
                  className="form-control paycheck-calc-readonly calc-basic-months"
                  value={formatCurrency(activeResult.grossSalary)}
                  readOnly
                />
              </div>
            </div>
          )}

          {formData.disbursementType === 'Basic Production' && (
            <div className="paycheck-input-grid">
              <div className="form-group">
                <label htmlFor="production-base" className="form-label">Basic Production Component Base (EGP) *</label>
                <input
                  id="production-base"
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
                <span className="paycheck-profile-ref-text">{getDisbursementProfileRefText()}</span>
              </div>

              <div className="form-group">
                <label htmlFor="production-multiplier" className="form-label">Production Multiplier (Months) *</label>
                <input
                  id="production-multiplier"
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
                <label htmlFor="production-calc-gross" className="form-label">Calculated Base Gross (EGP)</label>
                <input
                  id="production-calc-gross"
                  type="text"
                  className="form-control paycheck-calc-readonly calc-production"
                  value={formatCurrency(activeResult.grossSalary)}
                  readOnly
                />
              </div>
            </div>
          )}

          {formData.disbursementType === 'Bond Distribution' && (
            <div className="paycheck-input-grid">
              <div className="form-group">
                <label htmlFor="bonds-count" className="form-label">Number of Bonds Held *</label>
                <input
                  id="bonds-count"
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
                <span className="paycheck-profile-ref-text">{getDisbursementProfileRefText()}</span>
              </div>

              <div className="form-group">
                <label htmlFor="bond-rate" className="form-label">Distribution Rate per Bond (EGP) *</label>
                <input
                  id="bond-rate"
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
                <label htmlFor="bonds-calc-payout" className="form-label">Total Distribution Payout (EGP)</label>
                <input
                  id="bonds-calc-payout"
                  type="text"
                  className="form-control paycheck-calc-readonly calc-bonds"
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
            <div className="paycheck-adhoc-group">
              <div className="form-group">
                <label htmlFor="disbursement-amount" className="form-label">{formData.disbursementType} Amount (EGP) *</label>
                <input
                  id="disbursement-amount"
                  type="number"
                  step="any"
                  className="form-control paycheck-adhoc-input"
                  value={formData.unitRate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({ ...formData, unitRate: val });
                    triggerCalculation(formData.period, formData.components, true, { unitRate: val });
                  }}
                  placeholder="e.g. 25000"
                  required
                />
                <span className="paycheck-input-helper-text">
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
          <div className="calculate-action-row paycheck-deductions-row">
            <div className="paycheck-deductions-group">
              <label className="paycheck-deduction-label">
                <input
                  type="checkbox"
                  checked={formData.includeTax !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, includeTax: val });
                    triggerCalculation(formData.period, formData.components, false, { includeTax: val });
                  }}
                  className="paycheck-calc-check"
                />
                Apply Income Tax Bracket
              </label>

              <label className="paycheck-deduction-label">
                <input
                  type="checkbox"
                  checked={formData.includeInsurance !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, includeInsurance: val });
                    triggerCalculation(formData.period, formData.components, false, { includeInsurance: val });
                  }}
                  className="paycheck-calc-check"
                />
                Social Insurance (11%)
              </label>

              <label className="paycheck-deduction-label">
                <input
                  type="checkbox"
                  checked={formData.includeMartyrsFund !== false}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setFormData({ ...formData, includeMartyrsFund: val });
                    triggerCalculation(formData.period, formData.components, false, { includeMartyrsFund: val });
                  }}
                  className="paycheck-calc-check"
                />
                Martyrs Fund (0.05%)
              </label>
            </div>

            <button
              type="button"
              className="btn-calculate-preview paycheck-recalc-btn"
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
            <div className="step-card-header-content">
              <h2 className="step-card-title">Live Cumulative YTD Tracker & Statutory Rates</h2>
              <p className="step-card-desc">Tracks year-to-date gross progression and suggests calculated statutory brackets</p>
            </div>
            {calculating && (
              <span className="paycheck-calculating-badge">
                <RefreshCw size={14} className="spinning-icon" /> Calculating...
              </span>
            )}
          </div>

          {/* HTTP 400 / CALCULATION ERROR WARNING BANNER */}
          {previewError && (
            <div
              id="preview-error-banner"
              role="alert"
              className="paycheck-warning-banner"
            >
              <span className="paycheck-warning-icon">⚠</span>
              <div>
                <strong>Statutory Preview Calculation Warning:</strong> {previewError}. Please review salary components or input exact payslip amounts in Step 4.
              </div>
            </div>
          )}

          {/* YTD PROGRESS BANNER */}
          <div className="paycheck-ytd-banner">
            <div>
              <span className="paycheck-ytd-label">Prior YTD Gross in Year</span>
              <div className="paycheck-ytd-val-prior">
                {formatCurrency(activeResult.priorYtdGross || 0)}
              </div>
            </div>

            <div className="paycheck-ytd-operator">+</div>

            <div>
              <span className="paycheck-ytd-label">Current Payout Gross</span>
              <div className="paycheck-ytd-val-current">
                {formatCurrency(effectiveGross)}
              </div>
            </div>

            <div className="paycheck-ytd-operator">=</div>

            <div className="paycheck-ytd-result-box">
              <span className="paycheck-ytd-result-label">New Cumulative YTD Gross</span>
              <div className="paycheck-ytd-result-val">
                {formatCurrency((activeResult.priorYtdGross || 0) + effectiveGross)}
              </div>
              <span className="paycheck-ytd-result-note">
                {formData.includeTax !== false
                  ? (activeResult.appliedTaxRate ? `Matched Bracket: ${activeResult.appliedTaxRate}% Tax Rate` : 'Statutory Progressive Tax (Law 175/2023)')
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
              <div className="stat-subtext">{activeResult.isLocalFallback ? 'Awaiting calculation' : (activeResult.appliedTaxRate ? `Law 175/2023 progressive (${activeResult.appliedTaxRate}%)` : 'Tax exempt')}</div>
            </div>

            <div className="preview-stat-card">
              <div className="stat-header-row">
                <span className="stat-title">Social Insurance</span>
              </div>
              <div className="stat-amount deduction-color">{formatCurrency(activeResult.expectedInsurance)}</div>
              <div className="stat-subtext">{formData.includeInsurance ? (activeResult.isLocalFallback ? '11% Insurable Base' : `11% of ${formatCurrency(activeResult.insurableIncome || activeResult.cappedInsurableIncome || 0)}`) : '0.00 EGP (Off)'}</div>
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
        <div className="form-step-card paycheck-manual-step-card">
          <div className="step-card-header">
            <span className="step-number-badge step-manual-badge">4</span>
            <div className="step-card-header-content">
              <div className="paycheck-step4-header-top">
                <h2 className="step-card-title">Manual Entries & Exact Payslip Numbers</h2>
                <button
                  type="button"
                  onClick={handleSyncFromCalculator}
                  className="paycheck-sync-btn"
                >
                  <RefreshCw size={13} /> Sync from Calculator
                </button>
              </div>
              <p className="step-card-desc">
                Type the exact numbers from your payslip if they differ from statutory suggestions.
              </p>
            </div>
          </div>

          <div className="paycheck-manual-grid">
            <div className="form-group">
              <label htmlFor="manual-gross" className="form-label paycheck-manual-label">
                Gross Payout (EGP) *
              </label>
              <input
                id="manual-gross"
                type="number"
                step="any"
                className="form-control paycheck-manual-input input-gross"
                placeholder={String(activeResult.grossSalary)}
                value={formData.manualGross}
                onChange={(e) => setFormData({ ...formData, manualGross: e.target.value })}
              />
              <span className="paycheck-manual-subtext">Suggested: {formatCurrency(activeResult.grossSalary)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="manual-tax" className="form-label paycheck-manual-label">
                Tax Deducted (EGP)
              </label>
              <input
                id="manual-tax"
                type="number"
                step="any"
                className="form-control paycheck-manual-input input-deduction"
                placeholder={String(activeResult.expectedTax)}
                value={formData.manualTax}
                onChange={(e) => setFormData({ ...formData, manualTax: e.target.value })}
              />
              <span className="paycheck-manual-subtext">Suggested: {formatCurrency(activeResult.expectedTax)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="manual-insurance" className="form-label paycheck-manual-label">
                Social Insurance Deducted (EGP)
              </label>
              <input
                id="manual-insurance"
                type="number"
                step="any"
                className="form-control paycheck-manual-input input-deduction"
                placeholder={String(activeResult.expectedInsurance)}
                value={formData.manualInsurance}
                onChange={(e) => setFormData({ ...formData, manualInsurance: e.target.value })}
              />
              <span className="paycheck-manual-subtext">Suggested: {formatCurrency(activeResult.expectedInsurance)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="manual-other-deductions" className="form-label paycheck-manual-label">
                Other Deductions / Fund (EGP)
              </label>
              <input
                id="manual-other-deductions"
                type="number"
                step="any"
                className="form-control paycheck-manual-input input-deduction"
                placeholder={String(activeResult.martyrsFund + activeResult.customDeductions)}
                value={formData.manualOtherDeductions}
                onChange={(e) => setFormData({ ...formData, manualOtherDeductions: e.target.value })}
              />
              <span className="paycheck-manual-subtext">Fund/Misc: {formatCurrency(activeResult.martyrsFund + activeResult.customDeductions)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="manual-net-pay" className="form-label paycheck-manual-label-strong">
                Final Net Disbursed (EGP) *
              </label>
              <input
                id="manual-net-pay"
                type="number"
                step="any"
                className="form-control paycheck-manual-input input-net"
                placeholder={String(effectiveNet)}
                value={formData.manualNetPay}
                onChange={(e) => setFormData({ ...formData, manualNetPay: e.target.value })}
              />
              <span className="paycheck-manual-subtext-net">Calculated Net: {formatCurrency(calculatedNet)}</span>
            </div>
          </div>

          <div className="form-group paycheck-memo-group">
            <label htmlFor="disbursement-notes" className="form-label">Disbursement Notes / Audit Memo</label>
            <textarea
              id="disbursement-notes"
              className="form-control"
              rows={2}
              placeholder={`e.g. ${formData.disbursementType} payout for ${formData.period}`}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* HIGH-VISIBILITY LOG SUBMIT CTA BUTTON */}
          <div className="paycheck-submit-bar">
            <div className="paycheck-submit-summary">
              <div className="paycheck-submit-ready-label">
                Ready to record in ledger:
              </div>
              <div className="paycheck-preview-val highlight-color">
                {formData.disbursementType} {formData.multiplier > 1 ? `(${formData.multiplier}x)` : ''} — <span className="paycheck-preview-net-highlight">{formatCurrency(effectiveNet)} Net</span>
              </div>
              <div className="paycheck-submit-meta">
                Gross: {formatCurrency(effectiveGross)} | Total Deductions: {formatCurrency(effectiveTotalDeductions)}
              </div>
            </div>

            <div className="paycheck-submit-actions">
              <button
                type="button"
                className="paycheck-cancel-btn"
                onClick={() => navigate('/paycheck-log')}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="paycheck-submit-btn"
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
