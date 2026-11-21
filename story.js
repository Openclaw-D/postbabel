(function (root) {
  'use strict';

  const esc = value => root.PBViews.esc(value);
  const usd = value => '$' + Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const artwork = 'https://commons.wikimedia.org/wiki/File:Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg';
  const labels = {
    met: 'Meets requirement',
    partial: 'Partial support',
    missing: 'Unknown',
    miss: 'Misses requirement'
  };

  function action(name, value, label) {
    return `<button class="storyLink" type="button" data-act="${esc(name)}" data-value="${esc(value)}">${esc(label)}</button>`;
  }

  function hero(brief) {
    return `<section class="storyHero" aria-labelledby="storyTitle">
      <div class="storyHeroCopy">
        <h1 id="storyTitle"><span>${esc(brief.quantity)} LABUBUs.</span> <br><span>Who can deliver?</span></h1>
        <p>Your budget is ${esc(usd(brief.unitBudget))} per LABUBU figure. Three suppliers reply in Chinese. Check which terms each one puts in writing.</p>
        <a class="storyPrimary" href="#sourcing">Compare quotes for ${esc(brief.quantity)} units</a>
      </div>
      <figure class="towerArt">
        <picture><img src="assets/babel-hero.webp"
          srcset="assets/babel.webp 439w, assets/babel-medium.webp 800w, assets/babel-hero.webp 1240w"
          sizes="(max-width: 760px) 100vw, 55vw" width="1240" height="932" fetchpriority="high"
          alt="Bruegel’s Tower of Babel rises above a crowded harbor."></picture>
        <figcaption><a href="${artwork}">The Tower of Babel · Pieter Bruegel the Elder, 1563</a></figcaption>
      </figure>
    </section>`;
  }

  function sourcingIntro(brief) {
    return `<div class="caseIntro">
      <div>
        <h2 id="sourcingTitle">One order, three simulated quotes</h2>
        <p><strong>${esc(brief.quantity)} units of ${esc(brief.product)}</strong></p>
        <p>Up to ${esc(usd(brief.unitBudget))} per unit, all from the same edition. Freight and taxes are outside the unit budget.</p>
        <details><summary>Read the sample quotes</summary><ul>${brief.offers.map(offer =>
          `<li>${action('quoteSource', offer.id, 'Supplier ' + offer.id + ' · ' + usd(offer.unitPrice))}</li>`).join('')}</ul></details>
      </div>
      <figure class="productArt">
        <img src="assets/labubu-green-grape.webp" width="400" height="400" loading="lazy"
          alt="LABUBU Green Grape from THE MONSTERS Exciting Macaron series.">
        <figcaption><a href="https://www.popmart.com/us/products/675/THE-MONSTERS---Exciting-Macaron-Vinyl-Face-Blind-Box">Product image · POP MART</a></figcaption>
      </figure>
    </div>`;
  }

  function arrival(days) {
    return days === 42 ? '6 weeks' : days + (days === 1 ? ' day' : ' days');
  }

  function collectorTable() {
    const rows = root.PBData.offers.map(offer => {
      const shipping = offer.ship ? '+' + usd(offer.ship) + ' shipping' : 'Shipping included';
      return `<tr>
        <th scope="row">${action('listingSource', offer.key, offer.name)}</th>
        <td><strong>${esc(usd(offer.price))}</strong><br><small>${esc(shipping)}</small></td>
        <td>${esc(arrival(offer.days))}</td>
        <td><span>${esc(offer.photo)}</span><br><small>${esc(offer.stamp)} · ${esc(offer.code)}</small></td>
        <td>${esc(offer.seller)}</td>
      </tr>`;
    }).join('');
    return `<div class="tablewrap" role="region" aria-label="Four sample collector listings" tabindex="0">
      <table class="collectorTable">
        <caption class="sr">Listed prices, arrival estimates, edition details and sellers</caption>
        <thead><tr><th scope="col">Original listing</th><th scope="col">Price (USD)</th>
          <th scope="col">Arrival</th><th scope="col">Edition / code</th><th scope="col">Seller</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  function form(mode, axes, picked) {
    const choices = axes.map(axis => `<label class="criterion">
      <input type="checkbox" name="criteria" value="${esc(axis.id)}"${picked.includes(axis.id) ? ' checked' : ''}>
      <span>${esc(axis.label)}</span></label>`).join('');
    const submit = mode === 'sourcing' ? 'Compare supplier quotes' : 'Compare collector listings';
    return `<form class="criteriaForm" data-compare="${mode}" aria-labelledby="${mode}Criteria" tabindex="-1">
      <fieldset><legend id="${mode}Criteria">Which requirements matter to you?</legend>
        <div class="criteriaGrid">${choices}</div>
      </fieldset>
      <button class="storyPrimary" type="submit"${picked.length ? '' : ' disabled'}>${submit}</button>
    </form>`;
  }

  // All six axes share an inner baseline, so even one selected axis has a visible area.
  const inner = 0.25;
  const support = { met: 1, partial: (1 + inner) / 2, missing: inner, miss: inner };
  function point(i, level) {
    const angle = (i / 3 - 0.5) * Math.PI;
    return [180 + 91 * level * Math.cos(angle), 123 + 91 * level * Math.sin(angle)]
      .map(n => Number(n.toFixed(2)));
  }
  function polygon(levels) {
    return levels.map((level, i) => point(i, level).join(',')).join(' ');
  }
  function legendItem(label, mark) {
    return `<span><svg aria-hidden="true" width="24" height="14" viewBox="0 0 24 14">${mark}</svg> <span>${esc(label)}</span></span>`;
  }
  function chart(mode, axes, picked, row) {
    const teal = 'var(--offer-support-color, #11695f)', graphite = 'var(--requirement-color, #49525a)';
    const grid = [inner, (inner + 1) / 2, 1].map(level =>
      `<polygon points="${polygon(axes.map(() => level))}" fill="none" stroke="#d6dbd9"/>`).join('');
    const spokes = axes.map((axis, i) => {
      const [x, y] = point(i, 1);
      return `<line x1="180" y1="123" x2="${x}" y2="${y}" stroke="#d6dbd9"/>`;
    }).join('');
    const targets = axes.map(axis => picked.includes(axis.id) ? 1 : inner);
    const levels = row.states.map(state => support[state.status]);
    const markers = row.states.map((state, i) => {
      const [x, y] = point(i, levels[i]);
      if (state.status === 'miss') {
        return `<path d="M-3,-3 L3,3 M-3,3 L3,-3" transform="translate(${x} ${y})" style="stroke:${teal}" stroke-width="2.3"/>`;
      }
      const unknown = state.status === 'missing';
      return `<circle cx="${x}" cy="${y}" r="${unknown ? 4 : 2.8}" fill="${unknown ? 'white' : 'currentColor'}" style="fill:${unknown ? 'white' : teal};stroke:${teal}" stroke-width="1.7"/>`;
    }).join('');
    const names = axes.map((axis, i) => {
      const [x, y] = point(i, 1.12);
      const anchor = ['middle', 'start', 'start', 'middle', 'end', 'end'][i];
      return `<text x="${x}" y="${y}" dy=".35em" text-anchor="${anchor}">${esc(axis.short)}</text>`;
    }).join('');
    const legend = [
      legendItem('Your requirements', `<path d="M1 7h22" style="stroke:${graphite}" stroke-width="2" stroke-dasharray="4 3"/>`),
      legendItem('Offer support', `<path d="M1 7h22" style="stroke:${teal}" stroke-width="3"/>`),
      legendItem('Unknown', `<circle cx="12" cy="7" r="4" fill="white" style="stroke:${teal}" stroke-width="2"/>`),
      legendItem('Misses requirement', `<path d="m9 4 6 6m-6 0 6-6" style="stroke:${teal}" stroke-width="2"/>`)
    ].join('');
    return `<figure>
      <svg class="radar" viewBox="0 0 360 246" width="100%" role="img"
        aria-labelledby="${mode}ChartTitle ${mode}ChartDesc" xmlns="http://www.w3.org/2000/svg">
        <title id="${mode}ChartTitle">Requirements and offer support</title>
        <desc id="${mode}ChartDesc">Six axes in clockwise order. The evidence below gives the requirement and finding for each axis.</desc>
        ${grid}${spokes}
        <polygon data-series="support" points="${polygon(levels)}" style="fill:${teal};fill-opacity:.15;stroke:${teal}" stroke-width="3.4" stroke-linejoin="round"/>
        <polygon data-series="requirements" points="${polygon(targets)}" style="fill:${graphite};fill-opacity:.07;stroke:${graphite}" stroke-width="1.9" stroke-dasharray="5 4" stroke-linejoin="round"/>
        ${markers}
        <g font-size="12" fill="#283a36">${names}</g>
      </svg>
      <figcaption class="chartLegend">${legend}</figcaption>
      <details><summary>How to read this chart</summary>
        <p>The dashed line reaches the outer ring for each requirement you chose. Only those requirements count in the comparison.</p>
        <p>The solid line shows written support. The inner ring means no support, the middle means partial, and the outer ring means the requirement is met. An open dot means the evidence is missing. A cross marks a confirmed miss.</p>
        <p>Chart design adapted from the SEAL JUDGE six-axis, two-area comparison.</p>
      </details>
    </figure>`;
  }

  function evidence(axes, picked, row) {
    const selected = [], other = [];
    axes.forEach((axis, i) => {
      const finding = row.states[i];
      const list = picked.includes(axis.id) ? selected : other;
      list.push(`<li value="${i + 1}" data-axis="${esc(axis.id)}" data-status="${esc(finding.status)}">
        <strong>${esc(axis.label)}</strong>
        <p><b>${esc(labels[finding.status])}</b> · <span>${esc(finding.note)}</span></p></li>`);
    });
    return `<div><h4>Selected evidence</h4><ol class="evidenceList">${selected.join('')}</ol>
      ${other.length ? '<details><summary>Other dimensions</summary><ol class="evidenceList">' + other.join('') + '</ol></details>' : ''}
    </div>`;
  }

  function result(mode, axes, picked, rows, active) {
    const fullMatches = rows.filter(row => row.matched === picked.length);
    let headline = 'No offer meets every selected requirement.';
    if (fullMatches.length === 1) headline = 'Only ' + fullMatches[0].name + ' meets every selected requirement as written.';
    if (fullMatches.length > 1) headline = fullMatches.length + ' offers meet every selected requirement.';
    const tabs = rows.map(row => `<button type="button" data-act="pickOffer" data-mode="${mode}"
      data-value="${esc(row.id)}" aria-pressed="${row.id === active.id}"><span>${esc(row.name)}</span>
      <small>${esc(row.matched)}/${picked.length}</small></button>`).join('');
    const sourceActions = mode === 'sourcing' ? [
      action('quoteSource', active.id, 'Read original quote'),
      action('callNotes', active.id, 'Review call notes'),
      action('followUp', active.id, 'Draft a follow-up')
    ].join(' ') : action('listingSource', active.id, 'Read original listing');
    const price = esc(usd(active.price)) + (mode === 'sourcing' ? ' per unit' : '');
    return `<section class="comparisonResult" tabindex="-1" aria-labelledby="${mode}ResultTitle">
      <h3 id="${mode}ResultTitle">${esc(headline)}</h3>
      ${action('editCriteria', mode, 'Edit requirements')}
      <div class="offerTabs" role="group" aria-label="Choose an offer">${tabs}</div>
      <h4><span>${esc(active.name)}</span> · <span>${price}</span></h4>
      <p><strong>${esc(active.matched)} of ${picked.length} selected requirements met</strong></p>
      <div class="resultGrid">${evidence(axes, picked, active)}${chart(mode, axes, picked, active)}</div>
      <div class="controls">${sourceActions}</div>
    </section>`;
  }

  function flow(mode, state) {
    if (mode !== 'sourcing' && mode !== 'collector') return '';
    const comparison = state.comparisons?.[mode];
    const axes = root.PBCompare.axes(mode);
    const picked = axes.map(axis => axis.id).filter(id => comparison?.picked?.includes(id));
    if (!comparison?.submitted || !picked.length) return form(mode, axes, picked);
    const rows = root.PBCompare.rank(mode, picked, state.brief || root.PBData.brief);
    if (!rows.length) return form(mode, axes, picked);
    const active = rows.find(row => row.id === comparison.activeId) || rows[0];
    return result(mode, axes, picked, rows, active);
  }

  function home(state) {
    const brief = state.brief || root.PBData.brief;
    return `${hero(brief)}
      <section class="storySection" id="sourcing" aria-labelledby="sourcingTitle">
        ${sourcingIntro(brief)}
        <div id="sourcingFlow">${flow('sourcing', state)}</div>
      </section>
      <section class="storySection" id="collector" aria-labelledby="collectorTitle">
        <h2 id="collectorTitle">One figure, four listings</h2>
        <p>Ava has $220 for a Green Grape. These sample listings differ on edition, delivery and who is selling.</p>
        ${collectorTable()}
        <div id="collectorFlow">${flow('collector', state)}</div>
        ${action('begin', '', 'Explore the verification workspace')}
      </section>`;
  }

  const chinese = {
    'Who can deliver?': '谁能按约交货？',
    'Bruegel’s Tower of Babel rises above a crowded harbor.': '勃鲁盖尔笔下的巴别塔耸立在繁忙的港口旁。',
    'The Tower of Babel · Pieter Bruegel the Elder, 1563': '《巴别塔》· 老彼得·勃鲁盖尔，1563 年',
    'One order, three simulated quotes': '一张采购单，三份模拟报价',
    'Read the sample quotes': '查看模拟报价原文',
    'LABUBU Green Grape from THE MONSTERS Exciting Macaron series.': 'THE MONSTERS 心动马卡龙系列的 LABUBU 绿葡萄。',
    'Product image · POP MART': '产品图片 · 泡泡玛特',
    'Which requirements matter to you?': '这次采购，你关心哪些条件？',
    'Compare supplier quotes': '比较供应商报价',
    'Compare collector listings': '比较购买渠道',
    'One figure, four listings': '同一款公仔，四个购买渠道',
    'Ava has $220 for a Green Grape. These sample listings differ on edition, delivery and who is selling.': 'Ava 想用 220 美元买一只绿葡萄。四份模拟商品信息列出了不同的版次、到货时间和卖家。',
    'Four sample collector listings': '四份模拟商品信息',
    'Listed prices, arrival estimates, edition details and sellers': '各渠道的标价、预计到货时间、版次信息和卖家',
    'Original listing': '商品原文', 'Price (USD)': '标价（美元）', 'Arrival': '预计到货', 'Edition / code': '版次／防伪码',
    'Seller': '卖家', 'Shipping included': '包邮', '6 weeks': '6 周',
    'Resale A': '转售 A', 'Resale B': '转售 B', 'Official channel': '官方渠道', 'Amazon third party': '亚马逊第三方',
    'Re-release stamp': '再版钢印', 'First-edition stamp': '初版钢印', 'Disclosed restock': '注明为补货批次',
    'Listing photo only': '仅有商品照片', 'Official channel (simulated)': '官方渠道（模拟）',
    'No offer meets every selected requirement.': '没有一份报价符合全部所选条件。',
    'Edit requirements': '修改所选条件', 'Choose an offer': '选择要查看的报价',
    'Meets requirement': '符合要求', 'Partial support': '部分有据', 'Unknown': '证据未知', 'Misses requirement': '明确不符',
    'Selected evidence': '所选条件的依据', 'Other dimensions': '其他维度', 'Your requirements': '所选条件', 'Offer support': '报价依据',
    'Requirements and offer support': '所选条件与报价依据',
    'Six axes in clockwise order. The evidence below gives the requirement and finding for each axis.': '六个维度按顺时针排列。下方的证据逐项说明了条件与对应依据。',
    'How to read this chart': '如何阅读这张图',
    'The dashed line reaches the outer ring for each requirement you chose. Only those requirements count in the comparison.': '选中的条件以延伸至外圈的虚线表示。排名仅计入这些条件。',
    'The solid line shows written support. The inner ring means no support, the middle means partial, and the outer ring means the requirement is met. An open dot means the evidence is missing. A cross marks a confirmed miss.': '实线表示书面依据。内圈表示没有支持依据，中圈表示部分有据，外圈表示符合要求。空心点表示缺少证据，叉号表示已知不符。',
    'Chart design adapted from the SEAL JUDGE six-axis, two-area comparison.': '图表设计改编自 SEAL JUDGE 的六轴双面积对比图。',
    'Read original quote': '查看报价原文', 'Review call notes': '查看通话记录', 'Draft a follow-up': '起草追问',
    'Read original listing': '查看商品原文', 'Explore the verification workspace': '进入核验工作区'
  };
  const patterns = [
    [/^(\d+) LABUBUs\.$/, n => n + ' 只 LABUBU，'],
    [/^Only (.+) meets every selected requirement as written\.$/, name => '只有「' + zh(name) + '」的书面报价符合全部所选条件。'],
    [/^(\d+) offers meet every selected requirement\.$/, n => '有 ' + n + ' 份报价符合全部所选条件。'],
    [/^Your budget is (\$[\d.,]+) per LABUBU figure\. Three suppliers reply in Chinese\. Check which terms each one puts in writing\.$/, price => '每只 LABUBU 的预算是 ' + price + '。三家供应商用中文回复了询价，看看各家书面确认了哪些条件。'],
    [/^Compare quotes for (\d+) units$/, n => '比较 ' + n + ' 只的采购报价'],
    [/^(\d+) units of LABUBU Green Grape$/, n => n + ' 只 LABUBU 绿葡萄'],
    [/^Up to (\$[\d.,]+) per unit, all from the same edition\. Freight and taxes are outside the unit budget\.$/, price => '每只最多 ' + price + '，须为同一版次。单价预算不含运费和税费。'],
    [/^Supplier ([ABC])(?: · (\$[\d.,]+))?$/, (id, price) => '供应商 ' + id + (price ? ' · ' + price : '')],
    [/^\+(\$[\d.,]+) shipping$/, price => '另加 ' + price + ' 运费'],
    [/^(\d+) days?$/, n => n + ' 天'],
    [/^(\$[\d.,]+) per unit$/, price => '每只 ' + price],
    [/^(\d+) of (\d+) selected requirements met$/, (count, total) => '所选 ' + total + ' 项条件中，符合 ' + count + ' 项']
  ];

  function zh(text) {
    if (Object.prototype.hasOwnProperty.call(chinese, text)) return chinese[text];
    for (const [pattern, format] of patterns) {
      const match = pattern.exec(text);
      if (match) return format(...match.slice(1));
    }
    return text;
  }

  root.PBStory = { home, flow, zh };
})(globalThis);
