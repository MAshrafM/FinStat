// frontend/src/pages/gold/GoldSummaryPage.js
import React, { useMemo, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';
import { Badge, Delta, Loading } from '../../components/ui';
import { useGoldData } from '../../context/GoldContext';
import './GoldWallet.css';

const deltaTone = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

const deltaSign = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'none';
};

const deltaLabel = (value) => (value < 0 ? 'Loss' : 'Gain');

const formatDelta = (value, formatter) => (
  <Delta
    value={formatter(Math.abs(value))}
    tone={deltaTone(value)}
    sign={deltaSign(value)}
    label={deltaLabel(value)}
  />
);

const GoldSummaryPage = () => {
    const { goldSummary, marketPrices, overallTotalPaid, goldtotalNow, isLoading, error } = useGoldData();
    const [expandedCardIds, setExpandedCardIds] = useState(new Set());

    const { holdSummary, soldSummary } = useMemo(() => {
        const hold = goldSummary.filter(item => item.status === 'hold' || !item.status).sort((a, b) => b.karat - a.karat);
        const sold = goldSummary.filter(item => item.status === 'sold').sort((a, b) => b.karat - a.karat);
        return { holdSummary: hold, soldSummary: sold };
    }, [goldSummary]);

    const overallSoldValue = soldSummary.reduce((acc, item) => acc + item.totalSellingPrice, 0);

    const spotPrice24k = Number(marketPrices['24'] || marketPrices['24K'] || 0);
    const totalEquivalentGrams = holdSummary.reduce((acc, item) => acc + (item.totalWeight * ((item.karat || 24) / 24)), 0);
    const totalStandardizedValue = totalEquivalentGrams * spotPrice24k;
    const holdingsPct = (((goldtotalNow / overallTotalPaid) - 1) * 100).toFixed(2);
    const holdingsPctNumber = Number(holdingsPct);

    const toggleCard = (id) => {
        setExpandedCardIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="page-container gold-page-container gold-summary-page">
                <div className="gold-loading-wrap">
                    <Loading variant="card" text="Loading gold holdings..." />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container gold-page-container gold-summary-page">
            <header className="gold-header">
                <div className="gold-header-title-group">
                    <p className="gold-breadcrumb">Gold &gt; Holdings Summary</p>
                    <h1>Gold Holdings Summary</h1>
                </div>
            </header>

            {error && (
                <div className="gold-error-card" role="alert">
                    <h2>Unable to load gold holdings</h2>
                    <p>Failed to load holdings or market prices.</p>
                </div>
            )}

            <div className="gold-kpi-grid">
                <div className="gold-kpi-card">
                    <span className="gold-kpi-label">Total Paid (Holdings)</span>
                    <span className="gold-kpi-value fs-num">{formatCurrency(overallTotalPaid)}</span>
                </div>
                <div className="gold-kpi-card">
                    <span className="gold-kpi-label">Current Value (Holdings)</span>
                    <span className="gold-kpi-value fs-num">{formatCurrency(goldtotalNow)}</span>
                </div>
                <div className="gold-kpi-card">
                    <span className="gold-kpi-label">24K Equiv. Weight</span>
                    <span className="gold-kpi-value fs-num">{totalEquivalentGrams.toFixed(3)}g</span>
                </div>
                <div className="gold-kpi-card">
                    <span className="gold-kpi-label">24K Standardized Value</span>
                    <span className="gold-kpi-value fs-num">{formatCurrency(totalStandardizedValue)}</span>
                </div>
                <div className="gold-kpi-card">
                    <span className="gold-kpi-label">P/L (Holdings)</span>
                    {formatDelta(holdingsPctNumber, (value) => `${value.toFixed(2)}%`)}
                </div>
                <div className="gold-kpi-card">
                    <span className="gold-kpi-label">Total Sold Value</span>
                    <span className="gold-kpi-value fs-num">{formatCurrency(overallSoldValue)}</span>
                </div>
            </div>

            <h2 className="gold-section-title">Holdings</h2>
            <div className="gold-table-wrap" role="region" aria-label="Gold holdings table" tabIndex={0}>
                <table className="gold-table">
                    <thead>
                        <tr>
                            <th>Karat</th>
                            <th className="gold-th-num">Total Weight (g)</th>
                            <th className="gold-th-num">24K Equiv. Weight</th>
                            <th className="gold-th-num">Total Paid</th>
                            <th className="gold-th-num">Current Price/g</th>
                            <th className="gold-th-num">Current Market Value</th>
                            <th className="gold-th-num">24K Std. Value</th>
                            <th className="gold-th-num">P/L &amp; Rate of Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdSummary.map((item) => {
                            const karat = item.karat || 24;
                            const currentPricePerGram = marketPrices[karat] || 0;
                            const currentValue = item.totalWeight * currentPricePerGram;
                            const profitLoss = currentValue - item.totalPaid;
                            const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;
                            const equivGrams = item.totalWeight * (karat / 24);
                            const stdVal = equivGrams * spotPrice24k;

                            return (
                                <tr key={`hold-${karat}`}>
                                    <td data-label="Karat" className="gold-item-name">{karat}K</td>
                                    <td data-label="Weight" className="fs-num">{item.totalWeight.toFixed(4)}g</td>
                                    <td data-label="24K Weight" className="fs-num">{equivGrams.toFixed(4)}g</td>
                                    <td data-label="Paid" className="fs-num">{formatCurrency(item.totalPaid)}</td>
                                    <td data-label="Curr. Price" className="fs-num">{currentPricePerGram}</td>
                                    <td data-label="Value" className="fs-num">{formatCurrency(currentValue)}</td>
                                    <td data-label="24K Std. Value" className="fs-num">{formatCurrency(stdVal)}</td>
                                    <td data-label="Change" className="gold-pnl-cell fs-num">
                                        {formatDelta(profitLoss, formatCurrency)}
                                        <span className="gold-rate">({rateOfChange.toFixed(2)}%)</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <section className="gold-mobile-cards" aria-label="Gold holdings compact cards" data-testid="gold-summary-mobile-card-list">
                {holdSummary.map((item) => {
                    const karat = item.karat || 24;
                    const currentPricePerGram = marketPrices[karat] || 0;
                    const currentValue = item.totalWeight * currentPricePerGram;
                    const profitLoss = currentValue - item.totalPaid;
                    const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;
                    const equivGrams = item.totalWeight * (karat / 24);
                    const stdVal = equivGrams * spotPrice24k;
                    const cardId = `hold-${karat}`;
                    const isExpanded = expandedCardIds.has(cardId);

                    return (
                        <article className="gold-mobile-card" key={cardId}>
                            <div className="gold-card-compact-row">
                                <div className="gold-card-primary">
                                    <span className="gold-card-name">{karat}K Holding</span>
                                    <span className="gold-card-value">{item.totalWeight.toFixed(4)}g</span>
                                </div>
                                <div className="gold-card-metrics">
                                    <span className="gold-card-value fs-num">{equivGrams.toFixed(4)}g 24K</span>
                                </div>
                                <button
                                    type="button"
                                    className="gold-card-expander-btn"
                                    aria-expanded={isExpanded}
                                    aria-label={isExpanded ? 'Collapse holding details' : 'Expand holding details'}
                                    onClick={() => toggleCard(cardId)}
                                >
                                    {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="gold-card-expanded">
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Karat</span><span className="gold-card-detail-val fs-num">{karat}K</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Total Weight (g)</span><span className="gold-card-detail-val fs-num">{item.totalWeight.toFixed(4)}g</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">24K Equiv. Weight</span><span className="gold-card-detail-val fs-num">{equivGrams.toFixed(4)}g</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Total Paid</span><span className="gold-card-detail-val fs-num">{formatCurrency(item.totalPaid)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Current Price/g</span><span className="gold-card-detail-val fs-num">{currentPricePerGram}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Current Market Value</span><span className="gold-card-detail-val fs-num">{formatCurrency(currentValue)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">24K Std. Value</span><span className="gold-card-detail-val fs-num">{formatCurrency(stdVal)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">P/L</span><span className="gold-card-detail-val fs-num">{formatDelta(profitLoss, formatCurrency)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Rate of Change</span><span className="gold-card-detail-val fs-num">({rateOfChange.toFixed(2)}%)</span></div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </section>

            <h2 className="gold-section-title">Sold Gold Summary</h2>
            <div className="gold-table-wrap" role="region" aria-label="Sold gold summary table" tabIndex={0}>
                <table className="gold-table">
                    <thead>
                        <tr>
                            <th>Karat</th>
                            <th className="gold-th-num">Total Weight (g)</th>
                            <th className="gold-th-num">Total Paid</th>
                            <th className="gold-th-num">Total Selling Price</th>
                            <th className="gold-th-num">Avg. Holding Period</th>
                            <th className="gold-th-num">P/L &amp; Rate of Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {soldSummary.map((item) => {
                            const karat = item.karat;
                            const profitLoss = item.totalSellingPrice - item.totalPaid;
                            const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;

                            return (
                                <tr key={`sold-${karat}`}>
                                    <td data-label="Karat" className="gold-item-name">{karat}K</td>
                                    <td data-label="Weight" className="fs-num">{item.totalWeight.toFixed(4)}g</td>
                                    <td data-label="Paid" className="fs-num">{formatCurrency(item.totalPaid)}</td>
                                    <td data-label="Selling Price" className="fs-num">{formatCurrency(item.totalSellingPrice)}</td>
                                    <td data-label="Holding Period" className="fs-num">{item.avgHoldingDays.toFixed(0)} days</td>
                                    <td data-label="Change" className="gold-pnl-cell fs-num">
                                        {formatDelta(profitLoss, formatCurrency)}
                                        <span className="gold-rate">({rateOfChange.toFixed(2)}%)</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <section className="gold-mobile-cards" aria-label="Sold gold compact cards" data-testid="gold-summary-sold-mobile-card-list">
                {soldSummary.map((item) => {
                    const karat = item.karat;
                    const profitLoss = item.totalSellingPrice - item.totalPaid;
                    const rateOfChange = item.totalPaid > 0 ? (profitLoss / item.totalPaid) * 100 : 0;
                    const cardId = `sold-${karat}`;
                    const isExpanded = expandedCardIds.has(cardId);

                    return (
                        <article className="gold-mobile-card" key={cardId}>
                            <div className="gold-card-compact-row">
                                <div className="gold-card-primary">
                                    <span className="gold-card-name">{karat}K Sold</span>
                                    <span className="gold-card-value fs-num">{formatCurrency(item.totalSellingPrice)}</span>
                                </div>
                                <div className="gold-card-metrics">
                                    <Badge label="Sold" />
                                </div>
                                <button
                                    type="button"
                                    className="gold-card-expander-btn"
                                    aria-expanded={isExpanded}
                                    aria-label={isExpanded ? 'Collapse sold details' : 'Expand sold details'}
                                    onClick={() => toggleCard(cardId)}
                                >
                                    {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                                </button>
                            </div>
                            {isExpanded && (
                                <div className="gold-card-expanded">
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Karat</span><span className="gold-card-detail-val fs-num">{karat}K</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Total Weight (g)</span><span className="gold-card-detail-val fs-num">{item.totalWeight.toFixed(4)}g</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Total Paid</span><span className="gold-card-detail-val fs-num">{formatCurrency(item.totalPaid)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Total Selling Price</span><span className="gold-card-detail-val fs-num">{formatCurrency(item.totalSellingPrice)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Avg. Holding Period</span><span className="gold-card-detail-val fs-num">{item.avgHoldingDays.toFixed(0)} days</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">P/L</span><span className="gold-card-detail-val fs-num">{formatDelta(profitLoss, formatCurrency)}</span></div>
                                    <div className="gold-card-detail-item"><span className="gold-card-detail-label">Rate of Change</span><span className="gold-card-detail-val fs-num">({rateOfChange.toFixed(2)}%)</span></div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </section>
        </div>
    );
};

export default GoldSummaryPage;
