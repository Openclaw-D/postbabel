(function (root) {
  'use strict';

  const data = root.PBData || require('./data.js');
  const engine = root.PB || require('./engine.js');
  const chinese = new Map();

  function text(en, zh) {
    chinese.set(en, zh);
    return en;
  }

  function state(status, en, zh) {
    return {status, note: text(en, zh)};
  }

  function known(value) {
    return Number.isFinite(value) && value >= 0;
  }

  function budget(price, limit, unit) {
    if (!known(price)) return state('missing', 'No price is listed.', '未列出价格。');
    if (unit && price > limit) {
      const over = Number((price - limit).toFixed(2));
      return state('miss', `Quoted at $${price} per unit. $${over} per unit over budget.`,
        `报价为每件 ${price} 美元，每件超出预算 ${over} 美元。`);
    }
    const status = price <= limit ? 'met' : 'miss';
    return unit
      ? state(status, `Quoted at $${price} per unit. The limit is $${limit}.`, `报价为每件 ${price} 美元，预算上限为 ${limit} 美元。`)
      : state(status, `Listed at $${price} before shipping and duty. The limit is $${limit}.`, `商品标价为 ${price} 美元，标价预算上限为 ${limit} 美元，运费和关税另核。`);
  }

  function sameEdition(offer) {
    if (offer.evidence?.edition === 'documented') {
      return state('met', 'The quote documents a matching edition.', '报价附有同版凭证。');
    }
    if (/版次待确认/.test(offer.source) || /edition still needs confirmation/i.test(offer.translation)) {
      return state('missing', 'The exact edition still needs confirmation.', '具体版次待确认。');
    }
    if (/同版/.test(offer.source) || /same (?:Green Grape )?edition/i.test(offer.translation)) {
      return state('partial', 'The supplier says the figures are the same edition. No edition document is supplied.', '供应商称商品同版，尚未提供版次凭证。');
    }
    return state('missing', 'No matching-edition evidence is supplied.', '未提供同版凭证。');
  }

  function stock(offer, brief) {
    if (offer.evidence?.stock === 'documented' && brief.quantity >= 100) {
      return state('met', `Stock is documented for ${brief.quantity} units.`, `库存凭证涵盖 ${brief.quantity} 件。`);
    }
    if (/仓库确认库存/.test(offer.source) || /warehouse still needs to confirm stock/i.test(offer.translation)) {
      return state('missing', 'The warehouse still needs to confirm stock for all 100.', '100 件能否全部供货，仍待仓库确认库存。');
    }
    if (/都能安排/.test(offer.source) || /we can arrange/i.test(offer.translation)) {
      return state('missing', 'The supplier says it can arrange 100 units. On-hand stock is unconfirmed.', '供应商称 100 件“都能安排”，尚未确认现货库存。');
    }
    if (/可报\s*100/.test(offer.source) || /we can quote 100/i.test(offer.translation)) {
      return state('missing', 'The supplier can quote 100 units. On-hand stock is unconfirmed.', '供应商称“可报 100 只”，尚未确认现货库存。');
    }
    return state('missing', 'The quote supplies no stock confirmation for 100 units.', '报价中没有 100 件现货的确认凭证。');
  }

  function supply(offer) {
    if (offer.evidence?.supply === 'documented') {
      return state('met', 'The supplier provided evidence of authorized supply.', '供应商已提供授权供货凭证。');
    }
    if (/授权供货凭证稍后提供/.test(offer.source) || /paperwork will follow/i.test(offer.translation)) {
      return state('missing', 'Supply authorisation paperwork will follow.', '授权供货凭证稍后提供。');
    }
    if (offer.briefDocument === 'invoice') return state('missing', 'The brief includes an invoice. Supply authorisation still needs a separate document.', '采购简报附有发票，供货授权仍需单独凭证。');
    return state('missing', 'No evidence of authorized supply is attached.', '报价未附授权供货凭证。');
  }

  function dispatch(offer) {
    const terms = offer.logistics;
    const days = terms?.dispatchDays;
    if (!known(days)) {
      if (/库存确认后才能定交付日期/.test(terms?.source)) {
        return state('missing', 'We can give a delivery date once stock is confirmed.', '库存确认后才能定交付日期。');
      }
      return state('missing', 'The quote gives no dispatch deadline.', '报价未给出明确的发货期限。');
    }
    return state(days <= 7 ? 'met' : 'miss',
      `Dispatch within ${days} ${days === 1 ? 'day' : 'days'} of payment.`, `付款后 ${days} 天内发货。`);
  }

  function freight(offer) {
    switch (offer.logistics?.freightIncluded) {
      case true: return state('met', 'The price includes freight.', '这个价格含运费。');
      case false:
        if (/这份报价不含运费/.test(offer.logistics.source)) {
          return state('miss', 'This quote excludes freight.', '这份报价不含运费。');
        }
        return state('miss', 'Freight is extra.', '运费另外算。');
      default: return state('missing', 'The quote gives no freight terms.', '报价未说明运费条款。');
    }
  }

  function firstEdition(row) {
    if (row.photo === 'Disclosed restock') {
      return state('miss', 'The listing discloses a later restock.', '商品页面注明这是后续补货批次。');
    }
    if (row.photo === 'Re-release stamp') {
      return state('miss', `The photo shows a re-release stamp (${row.stamp}).`, `照片显示再版钢印（${row.stamp}）。`);
    }
    if (row.batchMatch) {
      return state('met', `The listed stamp ${row.stamp} matches the first-edition batch in the sample check.`,
        `所列钢印 ${row.stamp} 与模拟核验中的初版批次相符。`);
    }
    return state('missing', 'First-edition batch evidence is missing.', '缺少可确认初版的批次凭证。');
  }

  function scratchCode(row) {
    switch (row.codeState) {
      case 'used': return state('miss', `The sample registry marks ${row.code} as used.`, `模拟登记记录显示 ${row.code} 已使用。`);
      case 'unused': return state('met', `The sample registry marks ${row.code} as unused.`, `模拟登记记录显示 ${row.code} 尚未使用。`);
      default:
        if (row.code) return state('missing', `The sample registry has no entry for ${row.code}.`, `模拟登记记录中查无 ${row.code}。`);
        return state('missing', 'No check code is listed.', '商品页面未列出核验码。');
    }
  }

  function seller(row) {
    const check = row.checks.find(item => item.label === 'Seller identity');
    if (check?.level === 'pass') {
      if (row.identity === 'Official sample') {
        return state('met', 'The sample identifies the seller as the official channel.', '样本将卖家标记为模拟官方渠道。');
      }
      return state('met', 'The seller identity matches the sample registry.', '卖家身份与模拟登记记录相符。');
    }
    return state('missing', 'The sample has no verified seller identity.', '样本中缺少已核验的卖家身份证明。');
  }

  function arrival(row) {
    if (!known(row.days)) return state('missing', 'No arrival time is listed.', '商品页面未列出到货时间。');
    return state(row.days <= 3 ? 'met' : 'miss', `Listed time to arrival: ${row.days} ${row.days === 1 ? 'day' : 'days'}.`, `商品页面列出的到货时间为 ${row.days} 天。`);
  }

  function deliveredCost(row) {
    if (!known(row.price) || !known(row.ship)) {
      return state('missing', 'The listed price and shipping charge are both needed for a delivered total.', '计算到手总价需要商品标价及运费。');
    }
    if (!known(row.duty)) {
      return state('missing', `Listed at $${row.price} with $${row.ship} shipping. Duty is unconfirmed.`,
        `商品标价 ${row.price} 美元，运费 ${row.ship} 美元，关税金额待确认。`);
    }
    const total = Number((row.price + row.ship + row.duty).toFixed(2));
    return state('met', `Delivered total: $${total} ($${row.price} item + $${row.ship} shipping + $${row.duty} duty).`,
      `到手总价为 ${total} 美元（商品 ${row.price} + 运费 ${row.ship} + 关税 ${row.duty}，均为美元）。`);
  }

  function axis(id, short, shortZh, label, labelZh, read) {
    return {id, short: text(short, shortZh), label: text(label, labelZh), read};
  }

  // SEAL Judge, TWO-AREA-CONTRACT-V0.1.md and update-two-area-radar.py:
  // the two overlays share the same six positions. Keep the evidence state
  // at each position even when the corresponding priority is deselected.
  const sourcing = [
    axis('budget', 'Unit price', '单价', 'Unit price ≤ $40', '单价 ≤ 40 美元', o => budget(o.unitPrice, 40, true)),
    axis('edition', 'Edition', '版次', 'Documented same edition', '有凭证确认同版', sameEdition),
    axis('stock', 'Stock', '库存', 'Confirmed stock for 100 units', '确认有 100 件现货', stock),
    axis('supply', 'Source', '货源', 'Evidence of authorized supply', '有授权供货凭证', supply),
    axis('dispatch', 'Dispatch', '发货', 'Dispatch within 7 days of payment', '付款后 7 天内发货', dispatch),
    axis('freight', 'Freight', '运费', 'Freight included', '报价含运费', freight)
  ];
  const collector = [
    axis('budget', 'List price', '标价', 'Listed price ≤ $220', '商品标价 ≤ 220 美元', o => budget(o.price, 220, false)),
    axis('edition', 'Edition', '版次', 'First-edition batch', '初版批次', firstEdition),
    axis('code', 'Code', '核验码', 'Unused check code', '核验码未使用', scratchCode),
    axis('seller', 'Seller', '卖家', 'Seller identity evidence', '卖家身份凭证', seller),
    axis('arrival', 'Arrival', '到货', 'Listed arrival within 3 days', '所列到货时间在 3 天内', arrival),
    axis('cost', 'Total cost', '总价', 'Known delivered cost', '到手总价明确', deliveredCost)
  ];

  function criteria(mode) {
    if (mode === 'sourcing') return sourcing;
    if (mode === 'collector') return collector;
    throw new RangeError('Unknown comparison mode');
  }

  function axes(mode) {
    return criteria(mode).map(({id, short, label}) => ({id, short, label}));
  }

  function rank(mode, picksArray = [], brief = data.brief) {
    const rules = criteria(mode);
    const picked = new Set(picksArray);
    const isSourcing = mode === 'sourcing';
    const offers = isSourcing ? brief.offers : engine.lineup().rows;
    const rows = offers.map(offer => {
      const states = rules.map(({id, read}) => ({id, ...read(offer, brief)}));
      const selected = states.filter(s => picked.has(s.id));
      const matched = selected.filter(s => s.status === 'met').length;
      const partial = selected.filter(s => s.status === 'partial').length;
      const conflicts = selected.filter(s => s.status === 'miss').length;
      return {
        id: isSourcing ? offer.id : offer.key,
        name: isSourcing ? text(`Supplier ${offer.id}`, `供应商 ${offer.id}`) : offer.name,
        price: isSourcing ? offer.unitPrice : offer.price,
        states, matched, partial, conflicts, all: selected.length
      };
    });
    // A stable sort retains input order for identical selected evidence.
    return rows.sort((a, b) => b.matched - a.matched || b.partial - a.partial || a.conflicts - b.conflicts);
  }

  const api = {axes, rank, zh: source => chinese.get(source) ?? source};
  root.PBCompare = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
