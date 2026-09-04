(function () {
  'use strict';

  const PAGE_SLUG = 'san-dynamic-timeline';
  const DEFAULT_YEAR_WIDTH = 180;
  const MIN_ZOOM = 0.45;
  const MAX_ZOOM = 1.8;
  const COLOR_PALETTE = ['#176b87', '#b64234', '#397a58', '#a46b12', '#6651a8', '#287b78', '#87502c', '#456b9b'];
  const GROUPS = {
    conceptFamilies: 'Idea / concept family',
    sourceType: 'Source type',
    stageRole: 'Genealogy stage',
    evidenceGrade: 'Evidence grade',
    biologicalScale: 'Biological scale',
    medium: 'Medium',
    publicationState: 'Publication state',
  };
  const FILTERS = [
    ['conceptFamilies', 'Idea'],
    ['sourceType', 'Source type'],
    ['stageRole', 'Stage'],
    ['evidenceGrade', 'Evidence grade'],
    ['biologicalScale', 'Scale'],
    ['medium', 'Medium'],
    ['publicationState', 'Publication state'],
  ];

  let timelinePromise = null;
  let mountScheduled = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeXml(value) {
    return escapeHtml(value);
  }

  function valuesFor(event, key) {
    const value = event && event[key];
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    return value == null || value === '' ? [] : [String(value)];
  }

  function normalizeSearchText(value) {
    const text = String(value == null ? '' : value).toLowerCase();
    let normalized = '';
    let pendingSpace = false;

    for (const char of text) {
      const code = char.charCodeAt(0);
      const isAsciiLetter = code >= 97 && code <= 122;
      const isDigit = code >= 48 && code <= 57;
      if (isAsciiLetter || isDigit) {
        if (pendingSpace && normalized) normalized += ' ';
        normalized += char;
        pendingSpace = false;
      } else {
        pendingSpace = true;
      }
    }

    return normalized;
  }

  function uniqueValues(events, key) {
    return [...new Set(events.flatMap((event) => valuesFor(event, key)))].sort((left, right) => left.localeCompare(right));
  }

  function colorFor(value) {
    let hash = 0;
    for (const char of String(value || '')) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
  }

  function routeSlug() {
    const params = new URLSearchParams(window.location.search || '');
    return String(params.get('page') || '').trim().toLowerCase();
  }

  function dataUrl() {
    const root = window.SAN_PUBLIC_WIKI_ROOT || '/wiki';
    return root + '/public/san/data/san-dynamic-timeline.json';
  }

  function loadTimeline() {
    if (!timelinePromise) {
      timelinePromise = fetch(dataUrl(), { credentials: 'same-origin' }).then((response) => {
        if (!response.ok) throw new Error('Timeline data returned HTTP ' + response.status + '.');
        return response.json();
      }).then((data) => {
        if (!data || data.schema !== 'san-dynamic-timeline/v1' || !Array.isArray(data.events)) {
          throw new Error('Timeline data does not match the public SAN timeline contract.');
        }
        return data;
      });
    }
    return timelinePromise;
  }

  function optionHtml(value, label) {
    return '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + '</option>';
  }

  function localPageHref(slug) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('page', slug);
    return url.pathname + url.search;
  }

  function yearFraction(dateText) {
    const date = new Date(dateText + 'T12:00:00Z');
    const year = date.getUTCFullYear();
    const start = Date.UTC(year, 0, 1);
    const end = Date.UTC(year + 1, 0, 1);
    return (date.getTime() - start) / (end - start);
  }

  function csvCell(value) {
    const text = String(value == null ? '' : value);
    return '"' + text.replaceAll('"', '""') + '"';
  }

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  function wrapText(value, limit, maxLines) {
    const words = String(value || '').split(' ').filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (candidate.length <= limit || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    const consumed = lines.join(' ').length;
    if (consumed < String(value || '').length && lines.length) {
      lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:]?$/, '') + '...';
    }
    return lines;
  }

  function createExplorer(host, data) {
    const minYear = Number(data.range && (data.range.startYear ?? data.range.start)) || 2010;
    const maxYear = Number(data.range && (data.range.endYear ?? data.range.end)) || 2026;
    const events = data.events.slice().sort((left, right) => left.date.localeCompare(right.date));
    const state = {
      search: '',
      startYear: minYear,
      endYear: maxYear,
      groupBy: 'conceptFamilies',
      zoom: 1,
      selectedId: events.length ? events[0].id : '',
      filters: Object.fromEntries(FILTERS.map(([key]) => [key, ''])),
    };

    const groupOptions = Object.entries(GROUPS).map(([value, label]) => optionHtml(value, label)).join('');
    const filterControls = FILTERS.map(([key, label]) => {
      const options = uniqueValues(events, key).map((value) => optionHtml(value, value)).join('');
      return '<div class="san-timeline__control"><label for="san-timeline-filter-' + escapeHtml(key) + '">' +
        escapeHtml(label) + '</label><select id="san-timeline-filter-' + escapeHtml(key) + '" data-filter-key="' +
        escapeHtml(key) + '">' + optionHtml('', 'All') + options + '</select></div>';
    }).join('');

    host.className = 'san-timeline';
    host.id = 'san-timeline-explorer';
    host.setAttribute('aria-labelledby', 'san-timeline-heading');
    host.innerHTML =
      '<div class="san-timeline__header">' +
        '<div><div class="san-timeline__heading" id="san-timeline-heading" role="heading" aria-level="2">Explore the SAN genealogy</div>' +
        '<p>Move from the full chronology into one idea, source family, stage, scale, medium, or publication state. Every event retains its evidence boundary.</p></div>' +
        '<div class="san-timeline__count" id="san-timeline-count" aria-live="polite"></div>' +
      '</div>' +
      '<div class="san-timeline__controls">' +
        '<div class="san-timeline__control"><label for="san-timeline-search">Search events</label>' +
        '<input id="san-timeline-search" type="search" placeholder="Concept, source, phrase..." autocomplete="off"></div>' +
        '<div class="san-timeline__control"><label for="san-timeline-group">Group timeline by</label>' +
        '<select id="san-timeline-group">' + groupOptions + '</select></div>' +
        '<div class="san-timeline__control san-timeline__year-control"><label>Visible year range</label>' +
          '<div class="san-timeline__year-pair">' +
            '<label><output id="san-timeline-start-output">' + minYear + '</output><input id="san-timeline-start" type="range" min="' + minYear + '" max="' + maxYear + '" value="' + minYear + '"></label>' +
            '<label><output id="san-timeline-end-output">' + maxYear + '</output><input id="san-timeline-end" type="range" min="' + minYear + '" max="' + maxYear + '" value="' + maxYear + '"></label>' +
          '</div>' +
        '</div>' +
        filterControls +
      '</div>' +
      '<div class="san-timeline__toolbar">' +
        '<div class="san-timeline__toolbar-group" aria-label="Timeline zoom controls">' +
          '<button class="san-timeline__button" id="san-timeline-zoom-out" type="button" title="Zoom out" aria-label="Zoom out">-</button>' +
          '<span class="san-timeline__zoom-value" id="san-timeline-zoom-value">100%</span>' +
          '<button class="san-timeline__button" id="san-timeline-zoom-in" type="button" title="Zoom in" aria-label="Zoom in">+</button>' +
          '<button class="san-timeline__button" id="san-timeline-fit" type="button" title="Fit the selected years">Fit years</button>' +
          '<button class="san-timeline__button" id="san-timeline-clear" type="button">Clear filters</button>' +
        '</div>' +
        '<div class="san-timeline__toolbar-group">' +
          '<button class="san-timeline__button san-timeline__button--primary" id="san-timeline-svg" type="button">Download SVG</button>' +
          '<button class="san-timeline__button" id="san-timeline-csv" type="button">Download CSV</button>' +
        '</div>' +
      '</div>' +
      '<p class="san-timeline__status" id="san-timeline-status">Drag the timeline horizontally or use the zoom controls.</p>' +
      '<div class="san-timeline__viewport" id="san-timeline-viewport" tabindex="0" aria-label="Interactive SAN timeline">' +
        '<div class="san-timeline__canvas" id="san-timeline-canvas"></div>' +
      '</div>' +
      '<aside class="san-timeline__detail" id="san-timeline-detail" aria-live="polite"></aside>' +
      '<div class="san-timeline__legend" id="san-timeline-legend" aria-label="Timeline color legend"></div>';

    const elements = {
      count: host.querySelector('#san-timeline-count'),
      search: host.querySelector('#san-timeline-search'),
      group: host.querySelector('#san-timeline-group'),
      start: host.querySelector('#san-timeline-start'),
      end: host.querySelector('#san-timeline-end'),
      startOutput: host.querySelector('#san-timeline-start-output'),
      endOutput: host.querySelector('#san-timeline-end-output'),
      zoomOut: host.querySelector('#san-timeline-zoom-out'),
      zoomIn: host.querySelector('#san-timeline-zoom-in'),
      zoomValue: host.querySelector('#san-timeline-zoom-value'),
      fit: host.querySelector('#san-timeline-fit'),
      clear: host.querySelector('#san-timeline-clear'),
      svg: host.querySelector('#san-timeline-svg'),
      csv: host.querySelector('#san-timeline-csv'),
      status: host.querySelector('#san-timeline-status'),
      viewport: host.querySelector('#san-timeline-viewport'),
      canvas: host.querySelector('#san-timeline-canvas'),
      detail: host.querySelector('#san-timeline-detail'),
      legend: host.querySelector('#san-timeline-legend'),
      filterSelects: [...host.querySelectorAll('[data-filter-key]')],
    };

    function eventMatches(event) {
      const year = Number(event.date.slice(0, 4));
      if (year < state.startYear || year > state.endYear) return false;
      for (const [key] of FILTERS) {
        if (state.filters[key] && !valuesFor(event, key).includes(state.filters[key])) return false;
      }
      const query = normalizeSearchText(state.search);
      if (!query) return true;
      const haystack = normalizeSearchText([
        event.title, event.summary, event.boundary, event.dateLabel, event.pageSlug,
        ...FILTERS.flatMap(([key]) => valuesFor(event, key)),
      ].join(' '));
      return query.split(' ').filter(Boolean).every((term) => haystack.includes(term));
    }

    function visibleEvents() {
      return events.filter(eventMatches);
    }

    function groupName(event) {
      return valuesFor(event, state.groupBy)[0] || 'Not specified';
    }

    function groupedEvents(filtered) {
      const map = new Map();
      for (const event of filtered) {
        const name = groupName(event);
        if (!map.has(name)) map.set(name, []);
        map.get(name).push(event);
      }
      return [...map.entries()].sort(([left], [right]) => left.localeCompare(right));
    }

    function layoutLane(laneEvents, yearWidth, cardWidth) {
      const slots = [];
      return laneEvents.map((event) => {
        const year = Number(event.date.slice(0, 4));
        const x = Math.round(((year - state.startYear) + yearFraction(event.date)) * yearWidth + 12);
        let slot = slots.findIndex((rightEdge) => rightEdge + 12 < x);
        if (slot < 0) slot = slots.length;
        slots[slot] = x + cardWidth;
        return { event, x, slot };
      }).map((placement) => ({ ...placement, slotCount: slots.length }));
    }

    function renderDetail(event) {
      if (!event) {
        elements.detail.hidden = true;
        elements.detail.innerHTML = '';
        return;
      }
      const links = [
        { label: 'Open Encyclopedia page', url: localPageHref(event.pageSlug), local: true },
        ...event.sourceLinks.map((link) => ({ label: link.label, url: link.url, local: false })),
      ];
      elements.detail.hidden = false;
      elements.detail.innerHTML =
        '<div><p class="san-timeline__detail-date">' + escapeHtml(event.dateLabel || event.date) + '</p>' +
          '<div class="san-timeline__detail-title" role="heading" aria-level="3">' + escapeHtml(event.title) + '</div>' +
          '<p class="san-timeline__detail-summary">' + escapeHtml(event.summary) + '</p>' +
          '<p class="san-timeline__detail-boundary"><strong>Boundary:</strong> ' + escapeHtml(event.boundary) + '</p>' +
          '<div class="san-timeline__links">' + links.map((link) => '<a href="' + escapeHtml(link.url) + '"' +
            (link.local ? '' : ' target="_blank" rel="noopener noreferrer"') + '>' + escapeHtml(link.label) + '</a>').join('') + '</div>' +
        '</div>' +
        '<dl class="san-timeline__meta">' +
          '<dt>Ideas</dt><dd>' + escapeHtml(event.conceptFamilies.join(', ')) + '</dd>' +
          '<dt>Stage</dt><dd>' + escapeHtml(event.stageRole) + '</dd>' +
          '<dt>Evidence</dt><dd>' + escapeHtml(event.evidenceGrade) + '</dd>' +
          '<dt>Source</dt><dd>' + escapeHtml(event.sourceType) + '</dd>' +
          '<dt>Medium</dt><dd>' + escapeHtml(event.medium) + '</dd>' +
          '<dt>Scale</dt><dd>' + escapeHtml(event.biologicalScale.join(', ')) + '</dd>' +
          '<dt>Publication</dt><dd>' + escapeHtml(event.publicationState) + '</dd>' +
        '</dl>';
    }

    function renderLegend(groups) {
      elements.legend.innerHTML = groups.map(([name]) => '<span><i style="--legend-color:' +
        colorFor(name) + '"></i>' + escapeHtml(name) + '</span>').join('');
    }

    function renderTimeline(options) {
      const priorRatio = elements.viewport.scrollWidth > elements.viewport.clientWidth
        ? elements.viewport.scrollLeft / (elements.viewport.scrollWidth - elements.viewport.clientWidth)
        : 0;
      const filtered = visibleEvents();
      const groups = groupedEvents(filtered);
      const yearWidth = Math.round(DEFAULT_YEAR_WIDTH * state.zoom);
      const cardWidth = Math.max(150, Math.min(228, Math.round(yearWidth * 1.2)));
      const yearCount = state.endYear - state.startYear + 1;
      const canvasWidth = Math.max(elements.viewport.clientWidth || 720, yearCount * yearWidth + cardWidth + 30);
      const axis = '<div class="san-timeline__axis" style="width:' + canvasWidth + 'px">' +
        Array.from({ length: yearCount }, (_, index) => '<div class="san-timeline__year" style="left:' +
          (index * yearWidth) + 'px;width:' + yearWidth + 'px"><span>' + (state.startYear + index) + '</span></div>').join('') + '</div>';
      let totalHeight = 48;
      const lanes = groups.map(([name, laneEvents]) => {
        const placements = layoutLane(laneEvents, yearWidth, cardWidth);
        const slotCount = placements.length ? Math.max(...placements.map((item) => item.slotCount)) : 1;
        const laneHeight = Math.max(138, 57 + slotCount * 90);
        totalHeight += laneHeight;
        return '<section class="san-timeline__lane" style="height:' + laneHeight + 'px;width:' + canvasWidth +
          'px;--san-timeline-year-width:' + yearWidth + 'px" aria-label="' + escapeHtml(name) + '">' +
          '<div class="san-timeline__lane-label" role="heading" aria-level="3" style="border-left-color:' + colorFor(name) + '">' + escapeHtml(name) + '</div>' +
          placements.map(({ event, x, slot }) => '<button class="san-timeline__event" type="button" data-event-id="' +
            escapeHtml(event.id) + '" aria-pressed="' + (event.id === state.selectedId ? 'true' : 'false') + '" style="left:' +
            x + 'px;top:' + (48 + slot * 90) + 'px;--event-color:' + colorFor(name) +
            ';--san-timeline-card-width:' + cardWidth + 'px"><span class="san-timeline__event-date">' +
            escapeHtml(event.dateLabel || event.date) + '</span><span class="san-timeline__event-title">' +
            escapeHtml(event.title) + '</span></button>').join('') + '</section>';
      }).join('');
      elements.canvas.style.width = canvasWidth + 'px';
      elements.canvas.style.height = Math.max(totalHeight, 320) + 'px';
      elements.canvas.innerHTML = filtered.length ? axis + '<div class="san-timeline__lanes">' + lanes + '</div>' :
        '<p class="san-timeline__empty">No timeline events match the current filters.</p>';
      elements.count.textContent = filtered.length + ' of ' + events.length + ' events';
      elements.zoomValue.textContent = Math.round(state.zoom * 100) + '%';
      elements.startOutput.textContent = state.startYear;
      elements.endOutput.textContent = state.endYear;
      elements.status.textContent = filtered.length
        ? groups.length + ' ' + GROUPS[state.groupBy].toLowerCase() + ' group' + (groups.length === 1 ? '' : 's') +
          '; selected years ' + state.startYear + '-' + state.endYear + '.'
        : 'No events match. Clear one or more filters to restore the chronology.';
      const selected = filtered.find((event) => event.id === state.selectedId) || filtered[0] || null;
      state.selectedId = selected ? selected.id : '';
      renderDetail(selected);
      renderLegend(groups);
      if (options && options.preserveScroll) {
        requestAnimationFrame(() => {
          const maxScroll = Math.max(0, elements.viewport.scrollWidth - elements.viewport.clientWidth);
          elements.viewport.scrollLeft = Math.round(maxScroll * priorRatio);
        });
      }
    }

    function selectEvent(id) {
      state.selectedId = id;
      for (const button of elements.canvas.querySelectorAll('[data-event-id]')) {
        button.setAttribute('aria-pressed', button.dataset.eventId === id ? 'true' : 'false');
      }
      renderDetail(events.find((event) => event.id === id) || null);
    }

    function updateZoom(nextZoom) {
      state.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
      renderTimeline({ preserveScroll: true });
    }

    function resetControls() {
      state.search = '';
      state.startYear = minYear;
      state.endYear = maxYear;
      state.groupBy = 'conceptFamilies';
      state.zoom = 1;
      for (const [key] of FILTERS) state.filters[key] = '';
      elements.search.value = '';
      elements.start.value = String(minYear);
      elements.end.value = String(maxYear);
      elements.group.value = state.groupBy;
      for (const select of elements.filterSelects) select.value = '';
      renderTimeline();
      elements.viewport.scrollLeft = 0;
    }

    function downloadCsv() {
      const filtered = visibleEvents();
      const headers = ['date', 'date_label', 'title', 'summary', 'concept_families', 'source_type', 'medium', 'stage_role',
        'evidence_grade', 'publication_state', 'biological_scale', 'page_slug', 'source_links', 'boundary'];
      const rows = filtered.map((event) => [event.date, event.dateLabel, event.title, event.summary,
        event.conceptFamilies.join(' | '), event.sourceType, event.medium, event.stageRole, event.evidenceGrade,
        event.publicationState, event.biologicalScale.join(' | '), event.pageSlug,
        event.sourceLinks.map((link) => link.label + ': ' + link.url).join(' | '), event.boundary]);
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
      downloadBlob('san-dynamic-timeline-' + state.startYear + '-' + state.endYear + '.csv', csv, 'text/csv;charset=utf-8');
    }

    function buildSvg() {
      const filtered = visibleEvents();
      const groups = groupedEvents(filtered);
      const plotLeft = 310;
      const yearWidth = 240;
      const yearCount = state.endYear - state.startYear + 1;
      const width = Math.max(3600, plotLeft + yearCount * yearWidth + 320);
      const laneHeights = groups.map(([, laneEvents]) => Math.max(150, 78 + laneEvents.length * 52));
      const height = Math.max(900, 180 + laneHeights.reduce((sum, value) => sum + value, 0));
      let y = 150;
      const yearLines = Array.from({ length: yearCount }, (_, index) => {
        const x = plotLeft + index * yearWidth;
        return '<line x1="' + x + '" y1="115" x2="' + x + '" y2="' + (height - 40) + '" stroke="#d4dde4"/>' +
          '<text x="' + (x + 8) + '" y="136" font-size="20" font-weight="700" fill="#14263d">' +
          (state.startYear + index) + '</text>';
      }).join('');
      const laneSvg = groups.map(([name, laneEvents], laneIndex) => {
        const laneHeight = laneHeights[laneIndex];
        const color = colorFor(name);
        const laneTop = y;
        const laneBottom = y + laneHeight;
        const background = laneIndex % 2 ? '#fbfcfd' : '#f5f8fa';
        const items = laneEvents.map((event, eventIndex) => {
          const year = Number(event.date.slice(0, 4));
          const pointX = plotLeft + ((year - state.startYear) + yearFraction(event.date)) * yearWidth;
          const itemY = laneTop + 65 + eventIndex * 52;
          const boxX = Math.max(plotLeft + 5, Math.min(width - 295, pointX - 125));
          const titleLines = wrapText(event.title, 37, 2);
          return '<circle cx="' + pointX.toFixed(1) + '" cy="' + itemY + '" r="7" fill="' + color + '"/>' +
            '<line x1="' + pointX.toFixed(1) + '" y1="' + itemY + '" x2="' + boxX + '" y2="' + itemY + '" stroke="' + color + '" stroke-width="2"/>' +
            '<rect x="' + boxX + '" y="' + (itemY - 20) + '" width="280" height="42" rx="3" fill="#ffffff" stroke="' + color + '"/>' +
            '<text x="' + (boxX + 8) + '" y="' + (itemY - 6) + '" font-size="11" font-weight="700" fill="' + color + '">' +
              escapeXml(event.dateLabel || event.date) + '</text>' +
            titleLines.map((line, index) => '<text x="' + (boxX + 8) + '" y="' + (itemY + 8 + index * 12) +
              '" font-size="11" fill="#14263d">' + escapeXml(line) + '</text>').join('');
        }).join('');
        y = laneBottom;
        return '<rect x="30" y="' + laneTop + '" width="' + (width - 60) + '" height="' + laneHeight +
          '" fill="' + background + '" stroke="#cad4dd"/>' +
          '<rect x="45" y="' + (laneTop + 22) + '" width="235" height="34" fill="#ffffff" stroke="' + color + '"/>' +
          '<text x="58" y="' + (laneTop + 44) + '" font-size="15" font-weight="700" fill="#14263d">' +
          escapeXml(name) + '</text>' + items;
      }).join('');
      return '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
        '<rect width="100%" height="100%" fill="#ffffff"/>' +
        '<text x="40" y="52" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#14263d">SAN Dynamic Timeline, ' +
          state.startYear + '-' + state.endYear + '</text>' +
        '<text x="40" y="82" font-family="Arial, sans-serif" font-size="15" fill="#5e6d7e">' + filtered.length +
          ' source-graded events grouped by ' + escapeXml(GROUPS[state.groupBy].toLowerCase()) +
          '. Generated from the public Self Aware Networks Encyclopedia.</text>' +
        '<g font-family="Arial, sans-serif">' + yearLines + laneSvg + '</g>' +
        '<text x="40" y="' + (height - 18) + '" font-family="Arial, sans-serif" font-size="12" fill="#5e6d7e">selfawarenetworks.com/wiki/</text>' +
        '</svg>';
    }

    elements.search.addEventListener('input', () => {
      state.search = elements.search.value || '';
      renderTimeline();
    });
    elements.group.addEventListener('change', () => {
      state.groupBy = elements.group.value;
      renderTimeline();
    });
    elements.start.addEventListener('input', () => {
      state.startYear = Math.min(Number(elements.start.value), state.endYear);
      elements.start.value = String(state.startYear);
      renderTimeline();
    });
    elements.end.addEventListener('input', () => {
      state.endYear = Math.max(Number(elements.end.value), state.startYear);
      elements.end.value = String(state.endYear);
      renderTimeline();
    });
    for (const select of elements.filterSelects) {
      select.addEventListener('change', () => {
        state.filters[select.dataset.filterKey] = select.value;
        renderTimeline();
      });
    }
    elements.zoomOut.addEventListener('click', () => updateZoom(state.zoom - 0.15));
    elements.zoomIn.addEventListener('click', () => updateZoom(state.zoom + 0.15));
    elements.fit.addEventListener('click', () => {
      const yearCount = state.endYear - state.startYear + 1;
      const available = Math.max(420, elements.viewport.clientWidth - 190);
      updateZoom(available / (yearCount * DEFAULT_YEAR_WIDTH));
      elements.viewport.scrollLeft = 0;
    });
    elements.clear.addEventListener('click', resetControls);
    elements.csv.addEventListener('click', downloadCsv);
    elements.svg.addEventListener('click', () => downloadBlob(
      'san-dynamic-timeline-' + state.startYear + '-' + state.endYear + '.svg',
      buildSvg(),
      'image/svg+xml;charset=utf-8'
    ));
    elements.canvas.addEventListener('click', (event) => {
      const button = event.target.closest('[data-event-id]');
      if (button) selectEvent(button.dataset.eventId);
    });

    let pointerStart = null;
    elements.viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button, a, input, select')) return;
      pointerStart = { x: event.clientX, scrollLeft: elements.viewport.scrollLeft };
      elements.viewport.classList.add('is-panning');
      elements.viewport.setPointerCapture(event.pointerId);
    });
    elements.viewport.addEventListener('pointermove', (event) => {
      if (!pointerStart) return;
      elements.viewport.scrollLeft = pointerStart.scrollLeft - (event.clientX - pointerStart.x);
    });
    const endPan = () => {
      pointerStart = null;
      elements.viewport.classList.remove('is-panning');
    };
    elements.viewport.addEventListener('pointerup', endPan);
    elements.viewport.addEventListener('pointercancel', endPan);

    renderTimeline();
  }

  async function mount() {
    mountScheduled = false;
    if (routeSlug() !== PAGE_SLUG) return;
    const articleBody = document.getElementById('article-body');
    if (!articleBody || articleBody.querySelector('#san-timeline-explorer')) return;
    const firstSectionHeading = articleBody.querySelector('h2, h3');
    if (!firstSectionHeading) return;
    const host = document.createElement('section');
    host.id = 'san-timeline-explorer';
    host.className = 'san-timeline';
    host.innerHTML = '<p class="san-timeline__empty">Loading the public timeline data...</p>';
    articleBody.insertBefore(host, firstSectionHeading);
    try {
      const data = await loadTimeline();
      if (!host.isConnected || routeSlug() !== PAGE_SLUG) return;
      createExplorer(host, data);
    } catch (error) {
      host.innerHTML = '<p class="san-timeline__error">The timeline could not load: ' + escapeHtml(error.message) + '</p>';
    }
  }

  function scheduleMount() {
    if (mountScheduled) return;
    mountScheduled = true;
    queueMicrotask(mount);
  }

  const observer = new MutationObserver(scheduleMount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleMount);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMount, { once: true });
  } else {
    scheduleMount();
  }
}());
