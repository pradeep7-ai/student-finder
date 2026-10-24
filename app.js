/**
 * NeoPat Student Finder & Bulk Lookup Hub
 * Fast, pure client-side lookup, filtering, mobile cards, and Excel/CSV export.
 */

(function () {
  'use strict';

  // State Management
  const App = {
    database: {},
    currentResults: [],
    filteredResults: [],
    notFoundIds: [],
    currentView: 'table', // 'table' or 'cards'
    activeFilters: {
      searchQuery: '',
      campus: 'ALL',
      sortBy: 'INPUT_ORDER'
    },

    // Sample IDs for quick testing
    samples: {
      ten: [
        'V4I0G1R4', // Sujal Khera (Master + Venue MG)
        'W4C8Z9S1', // Dadi Harshitha (Master)
        'Y7L0H1J0', // sivaprathish (Venue MG)
        'Q5C0E3S7', // KALANGI GEETA NEHA (Master)
        'A3B2Q8T4', // Hari Samhita Pasupuleti (Master + Venue MG)
        'M4M9E4A3', // Soham Sinha (Venue MG)
        'J7T5B8J3', // GUJJARLAPUDI VINAY (Master)
        'D3A8T0H0', // Vinayak Joshi (Master + Venue)
        'W4D0P4E3', // Yash Sigchi (Master + Venue)
        'A4Q7G4Y6'  // Sowjanyaa Yoganandhan (Venue)
      ],
      fifty: [
        'V4I0G1R4', 'W4C8Z9S1', 'Y7L0H1J0', 'Q5C0E3S7', 'A3B2Q8T4',
        'M4M9E4A3', 'J7T5B8J3', 'D3A8T0H0', 'W4D0P4E3', 'A4Q7G4Y6',
        'C6J8I3Y0', 'I2G1B9C8', 'X0D9N2C4', 'W2D4I6Z8', 'G4L6F9B0',
        'D1K7B0U7', 'C5F9K9B6', 'F3F2J6G7', 'Y5J2Z2M7', 'U9R6C8R5',
        'Q4X8C2Y9', 'A6F7Y0U1', 'R5D0K5Y6', 'I6V4B3W8', 'F3R0G6S9',
        'T2F2R8T6', 'P2C0Y7A7', 'Z4K8O3Z4', 'L3V3P7Z2', 'N5S5G8V0',
        'Z3P5H6K3', 'O5E4Y3N9', 'A2N1G2J9', 'R1D2M3Q5', 'J5S1K0S4',
        'X3C0W8M4', 'L4M6M9F3', 'U5W9M0E6', 'O3Q2U4U6', 'M5X0W4K7',
        'D5P8O0T8', 'N0K2F1N9', 'H4V9H9P2', 'Q9B3L9P9', 'L7A6I1X1',
        'J3E8F3V4', 'Z5T4L4N5', 'I7K5V5H4', 'G1O5B1A2', 'I9F8M9P0'
      ]
    },

    // Initialize Application
    init: function () {
      this.initTheme();
      this.initDatabase();
      this.initEventListeners();
      this.detectInitialViewMode();
      this.updateDetectedInputCount();
    },

    // Theme Management
    initTheme: function () {
      const savedTheme = localStorage.getItem('NEOPAT_THEME') || 'light-theme';
      document.body.className = savedTheme;
    },

    toggleTheme: function () {
      const isDark = document.body.classList.contains('dark-theme');
      const newTheme = isDark ? 'light-theme' : 'dark-theme';
      document.body.className = newTheme;
      localStorage.setItem('NEOPAT_THEME', newTheme);
      this.showToast(`Switched to ${isDark ? 'Light' : 'Dark'} Mode`, 'info');
    },

    // Database Loader (with LocalStorage cache fallback)
    initDatabase: function () {
      const customDbStr = localStorage.getItem('CUSTOM_STUDENTS_DATABASE');
      if (customDbStr) {
        try {
          this.database = JSON.parse(customDbStr);
          this.updateDbStats('Custom Database');
          return;
        } catch (e) {
          console.warn('Failed to parse custom database from localStorage:', e);
        }
      }

      if (window.DEFAULT_STUDENTS_DATABASE) {
        this.database = window.DEFAULT_STUDENTS_DATABASE;
        this.updateDbStats();
      } else {
        // Fallback fetch from students_database.json if opened via webserver
        fetch('students_database.json')
          .then(res => res.json())
          .then(data => {
            this.database = data;
            this.updateDbStats();
          })
          .catch(err => {
            console.error('Database loading error:', err);
            this.showToast('Could not load database. Please import an Excel file.', 'error');
          });
      }
    },

    updateDbStats: function (label) {
      const count = Object.keys(this.database).length;
      const countPill = document.getElementById('db-record-count');
      if (countPill) {
        countPill.textContent = `${count.toLocaleString()} Records ${label ? '(' + label + ')' : 'Loaded'}`;
      }
    },

    // Detect View Mode on Load
    detectInitialViewMode: function () {
      if (window.innerWidth < 768) {
        this.switchView('cards');
      } else {
        this.switchView('table');
      }
    },

    // Event Listeners
    initEventListeners: function () {
      const self = this;

      // Theme toggle
      document.getElementById('btn-theme-toggle').addEventListener('click', () => self.toggleTheme());

      // Input changes & textarea typing
      const textarea = document.getElementById('bulk-neoid-input');
      textarea.addEventListener('input', () => self.updateDetectedInputCount());
      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          self.fetchDetails();
        }
      });

      // Quick Chips
      document.getElementById('btn-sample-10').addEventListener('click', () => self.loadSample(10));
      document.getElementById('btn-sample-50').addEventListener('click', () => self.loadSample(50));
      document.getElementById('btn-clear-input').addEventListener('click', () => self.clearInput());
      document.getElementById('btn-paste-clipboard').addEventListener('click', () => self.pasteClipboard());

      // Search Action Button
      document.getElementById('btn-fetch-details').addEventListener('click', () => self.fetchDetails());

      // Toolbar Controls
      document.getElementById('filter-search-input').addEventListener('input', (e) => {
        self.activeFilters.searchQuery = e.target.value.trim().toLowerCase();
        self.toggleClearFilterBtn(Boolean(self.activeFilters.searchQuery));
        self.applyFilters();
      });

      document.getElementById('btn-clear-filter').addEventListener('click', () => {
        const input = document.getElementById('filter-search-input');
        input.value = '';
        self.activeFilters.searchQuery = '';
        self.toggleClearFilterBtn(false);
        self.applyFilters();
      });

      document.getElementById('select-campus-filter').addEventListener('change', (e) => {
        self.activeFilters.campus = e.target.value;
        self.applyFilters();
      });

      document.getElementById('select-sort-by').addEventListener('change', (e) => {
        self.activeFilters.sortBy = e.target.value;
        self.applyFilters();
      });

      document.getElementById('btn-reset-filters').addEventListener('click', () => self.resetFilters());

      // View Toggle Buttons
      document.getElementById('view-mode-table').addEventListener('click', () => self.switchView('table'));
      document.getElementById('view-mode-cards').addEventListener('click', () => self.switchView('cards'));

      // Copy & Export Buttons
      document.getElementById('btn-copy-not-found').addEventListener('click', () => self.copyNotFoundList());
      document.getElementById('btn-export-excel').addEventListener('click', () => self.exportToExcel());
      document.getElementById('btn-export-csv').addEventListener('click', () => self.exportToCSV());
      document.getElementById('btn-copy-table').addEventListener('click', () => self.copyTableToClipboard());

      // Modals
      document.getElementById('btn-close-modal').addEventListener('click', () => self.closeStudentModal());
      document.getElementById('student-modal').addEventListener('click', (e) => {
        if (e.target.id === 'student-modal') self.closeStudentModal();
      });

      // Upload Modal
      document.getElementById('btn-open-upload-modal').addEventListener('click', () => self.openUploadModal());
      document.getElementById('btn-close-upload-modal').addEventListener('click', () => self.closeUploadModal());
      document.getElementById('upload-modal').addEventListener('click', (e) => {
        if (e.target.id === 'upload-modal') self.closeUploadModal();
      });

      document.getElementById('btn-reset-default-db').addEventListener('click', () => self.resetDefaultDatabase());

      // File Dropzone
      this.initDropzone();

      // Keyboard Esc to close modals
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          self.closeStudentModal();
          self.closeUploadModal();
        }
      });
    },

    // Parse Neo IDs from text
    parseInputIds: function (rawText) {
      if (!rawText) return [];
      // Clean and split by any whitespace, comma, newline, tab, semicolon
      const tokens = rawText
        .split(/[\r\n,;\t\s]+/)
        .map(t => t.replace(/["'\[\]\(\)]/g, '').trim().toUpperCase())
        .filter(t => t.length > 0);

      const deduplicate = document.getElementById('chk-deduplicate').checked;
      if (deduplicate) {
        return Array.from(new Set(tokens));
      }
      return tokens;
    },

    updateDetectedInputCount: function () {
      const text = document.getElementById('bulk-neoid-input').value;
      const ids = this.parseInputIds(text);
      const badge = document.getElementById('detected-count-badge');
      if (badge) {
        badge.textContent = `${ids.length.toLocaleString()} Neo ID${ids.length === 1 ? '' : 's'} detected`;
      }
    },

    clearInput: function () {
      document.getElementById('bulk-neoid-input').value = '';
      this.updateDetectedInputCount();
      document.getElementById('bulk-neoid-input').focus();
    },

    loadSample: function (count) {
      const sampleList = count === 10 ? this.samples.ten : this.samples.fifty;
      document.getElementById('bulk-neoid-input').value = sampleList.join('\n');
      this.updateDetectedInputCount();
      this.showToast(`Loaded ${sampleList.length} sample Neo IDs`, 'info');
      this.fetchDetails();
    },

    pasteClipboard: async function () {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            const textarea = document.getElementById('bulk-neoid-input');
            textarea.value = text;
            this.updateDetectedInputCount();
            this.showToast('Pasted content from clipboard!', 'success');
          } else {
            this.showToast('Clipboard is empty', 'info');
          }
        } else {
          this.showToast('Please press Ctrl+V to paste manually', 'info');
        }
      } catch (err) {
        this.showToast('Clipboard access was blocked. Use Ctrl+V.', 'info');
      }
    },

    // Main Query Execution
    fetchDetails: function () {
      const text = document.getElementById('bulk-neoid-input').value;
      const ids = this.parseInputIds(text);

      if (ids.length === 0) {
        this.showToast('Please paste at least one Neo ID first!', 'error');
        document.getElementById('bulk-neoid-input').focus();
        return;
      }

      const results = [];
      const notFound = [];
      let totalCgpa = 0;
      let validCgpaCount = 0;

      ids.forEach((id, index) => {
        const student = this.database[id];
        if (student) {
          // Clone and attach query order index
          const item = {
            ...student,
            inputIndex: index + 1,
            searchedId: id
          };
          results.push(item);

          const cgpaNum = parseFloat(item.cgpa);
          if (!isNaN(cgpaNum) && cgpaNum > 0) {
            totalCgpa += cgpaNum;
            validCgpaCount++;
          }
        } else {
          notFound.push({
            id: id,
            inputIndex: index + 1
          });
        }
      });

      this.currentResults = results;
      this.notFoundIds = notFound;

      // Update UI Stats
      document.getElementById('stat-total-input').textContent = ids.length.toLocaleString();
      document.getElementById('stat-found-count').textContent = results.length.toLocaleString();
      
      const foundPct = ids.length > 0 ? ((results.length / ids.length) * 100).toFixed(1) : '0';
      document.getElementById('stat-found-pct').textContent = `${foundPct}%`;

      document.getElementById('stat-notfound-count').textContent = notFound.length.toLocaleString();

      const avgCgpa = validCgpaCount > 0 ? (totalCgpa / validCgpaCount).toFixed(2) : '-';
      document.getElementById('stat-avg-cgpa').textContent = avgCgpa;

      // Handle Not Found UI
      this.renderNotFoundAlert(notFound);

      // Show Results Section, Hide Initial State
      document.getElementById('initial-empty-state').classList.add('hidden');
      document.getElementById('results-section').classList.remove('hidden');

      // Reset filters and render
      this.resetFilterInputsOnly();
      this.applyFilters();

      // Scroll smoothly to results
      document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

      this.showToast(`Found ${results.length.toLocaleString()} of ${ids.length.toLocaleString()} students!`, results.length > 0 ? 'success' : 'error');
    },

    renderNotFoundAlert: function (notFound) {
      const alertBox = document.getElementById('not-found-alert');
      const tagsContainer = document.getElementById('not-found-tags-container');
      const qtySpan = document.getElementById('not-found-qty');

      if (!notFound || notFound.length === 0) {
        alertBox.classList.add('hidden');
        tagsContainer.innerHTML = '';
        return;
      }

      alertBox.classList.remove('hidden');
      qtySpan.textContent = notFound.length.toLocaleString();

      // Render tags
      tagsContainer.innerHTML = notFound.map(item => `
        <span class="tag-not-found" title="Index #${item.inputIndex}">#${item.inputIndex}: ${this.escapeHtml(item.id)}</span>
      `).join('');
    },

    copyNotFoundList: function () {
      if (this.notFoundIds.length === 0) return;
      const list = this.notFoundIds.map(i => i.id).join('\n');
      navigator.clipboard.writeText(list).then(() => {
        this.showToast(`Copied ${this.notFoundIds.length} missing IDs to clipboard`, 'success');
      }).catch(() => {
        this.showToast('Could not copy to clipboard', 'error');
      });
    },

    // Filtering & Sorting Results
    resetFilterInputsOnly: function () {
      this.activeFilters = {
        searchQuery: '',
        campus: 'ALL',
        sortBy: 'INPUT_ORDER'
      };
      document.getElementById('filter-search-input').value = '';
      document.getElementById('select-campus-filter').value = 'ALL';
      document.getElementById('select-sort-by').value = 'INPUT_ORDER';
      this.toggleClearFilterBtn(false);
    },

    resetFilters: function () {
      this.resetFilterInputsOnly();
      this.applyFilters();
      this.showToast('Filters cleared', 'info');
    },

    toggleClearFilterBtn: function (show) {
      const btn = document.getElementById('btn-clear-filter');
      if (btn) {
        if (show) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
      }
    },

    applyFilters: function () {
      const { searchQuery, campus, sortBy } = this.activeFilters;

      let list = this.currentResults.slice();

      // 1. Campus filter
      if (campus !== 'ALL') {
        list = list.filter(s => s.campus && s.campus.toLowerCase() === campus.toLowerCase());
      }

      // 2. Search query filter
      if (searchQuery) {
        list = list.filter(s => {
          const matchName = s.name && s.name.toLowerCase().includes(searchQuery);
          const matchReg = s.regNo && s.regNo.toLowerCase().includes(searchQuery);
          const matchNeo = s.neoId && s.neoId.toLowerCase().includes(searchQuery);
          const matchDegree = s.degree && s.degree.toLowerCase().includes(searchQuery);
          const matchEmail = s.email && s.email.toLowerCase().includes(searchQuery);
          const matchMobile = s.mobile && s.mobile.includes(searchQuery);
          const matchCampus = s.campus && s.campus.toLowerCase().includes(searchQuery);
          return matchName || matchReg || matchNeo || matchDegree || matchEmail || matchMobile || matchCampus;
        });
      }

      // 3. Sort
      if (sortBy === 'INPUT_ORDER') {
        list.sort((a, b) => a.inputIndex - b.inputIndex);
      } else if (sortBy === 'CGPA_DESC') {
        list.sort((a, b) => (parseFloat(b.cgpa) || 0) - (parseFloat(a.cgpa) || 0));
      } else if (sortBy === 'CGPA_ASC') {
        list.sort((a, b) => (parseFloat(a.cgpa) || 0) - (parseFloat(b.cgpa) || 0));
      } else if (sortBy === 'NAME_ASC') {
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (sortBy === 'REGNO_ASC') {
        list.sort((a, b) => (a.regNo || '').localeCompare(b.regNo || ''));
      }

      this.filteredResults = list;

      // Update counter
      document.getElementById('visible-count').textContent = list.length.toLocaleString();
      document.getElementById('total-found-count').textContent = this.currentResults.length.toLocaleString();

      const resetBtn = document.getElementById('btn-reset-filters');
      const isFiltered = (campus !== 'ALL' || searchQuery !== '' || sortBy !== 'INPUT_ORDER');
      if (resetBtn) {
        if (isFiltered) resetBtn.classList.remove('hidden');
        else resetBtn.classList.add('hidden');
      }

      this.render();
    },

    // Rendering Active View
    render: function () {
      const noResultsBox = document.getElementById('no-filtered-results');
      const tableView = document.getElementById('table-view-container');
      const cardsView = document.getElementById('cards-view-container');

      if (this.filteredResults.length === 0) {
        noResultsBox.classList.remove('hidden');
        tableView.classList.add('hidden');
        cardsView.classList.add('hidden');
        return;
      }

      noResultsBox.classList.add('hidden');

      if (this.currentView === 'table') {
        tableView.classList.remove('hidden');
        cardsView.classList.add('hidden');
        this.renderTable();
      } else {
        tableView.classList.add('hidden');
        cardsView.classList.remove('hidden');
        this.renderCards();
      }
    },

    switchView: function (view) {
      this.currentView = view;
      document.getElementById('view-mode-table').classList.toggle('active', view === 'table');
      document.getElementById('view-mode-cards').classList.toggle('active', view === 'cards');
      this.render();
    },

    getCgpaClass: function (cgpa) {
      const num = parseFloat(cgpa);
      if (isNaN(num)) return 'cgpa-low';
      if (num >= 9.0) return 'cgpa-high';
      if (num >= 8.5) return 'cgpa-mid';
      return 'cgpa-low';
    },

    // Render Table View
    renderTable: function () {
      const tbody = document.getElementById('students-table-body');
      if (!tbody) return;

      const rowsHtml = this.filteredResults.map(s => {
        const cgpaBadge = s.cgpa ? `<span class="badge-cgpa ${this.getCgpaClass(s.cgpa)}">${this.escapeHtml(s.cgpa)}</span>` : '<span class="text-muted">-</span>';
        const resumeLink = s.resumeUrl ? `
          <a href="${this.escapeHtml(s.resumeUrl)}" target="_blank" rel="noopener noreferrer" class="btn-resume-link" title="Open Student Resume">
            <span>Resume</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : '<span class="text-muted">-</span>';

        const marksText = (s.mark10 || s.mark12) ? `${s.mark10 || '-'}% / ${s.mark12 || '-'}%` : '<span class="text-muted">-</span>';

        return `
          <tr>
            <td class="col-num">${s.inputIndex}</td>
            <td class="col-neoid">${this.escapeHtml(s.neoId)}</td>
            <td class="col-name">${this.escapeHtml(s.name || '-')}</td>
            <td class="col-regno">${this.escapeHtml(s.regNo || '-')}</td>
            <td class="col-cgpa">${cgpaBadge}</td>

            <td class="col-campus">${this.escapeHtml(s.campus || '-')}</td>
            <td class="col-degree" title="${this.escapeHtml(s.degree || '')}">${this.escapeHtml(s.degree || '-')}</td>
            <td class="col-mobile">
              ${s.mobile ? `<a href="tel:${this.escapeHtml(s.mobile)}" class="link-neutral">${this.escapeHtml(s.mobile)}</a>` : '<span class="text-muted">-</span>'}
            </td>
            <td class="col-email">
              ${s.email ? `<a href="mailto:${this.escapeHtml(s.email)}" class="link-neutral" title="${this.escapeHtml(s.email)}">${this.escapeHtml(s.email)}</a>` : '<span class="text-muted">-</span>'}
            </td>
            <td class="col-marks">${marksText}</td>
            <td class="col-resume">${resumeLink}</td>
            <td class="col-actions">
              <button class="btn-row-action" onclick="App.openStudentModal('${this.escapeHtml(s.neoId)}')" title="View Full Profile">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.innerHTML = rowsHtml;
    },

    // Render Mobile Cards View
    renderCards: function () {
      const container = document.getElementById('cards-view-container');
      if (!container) return;

      const cardsHtml = this.filteredResults.map(s => {
        const cgpaBadge = s.cgpa ? `<span class="badge-cgpa ${this.getCgpaClass(s.cgpa)}">CGPA: ${this.escapeHtml(s.cgpa)}</span>` : '';
        const campusBadge = s.campus ? `<span class="badge-neutral">${this.escapeHtml(s.campus)}</span>` : '';

        return `
          <div class="student-card">
            <div class="student-card-header">
              <div>
                <span class="student-card-order">#${s.inputIndex} &bull; ${this.escapeHtml(s.neoId)}</span>
                <h3 class="student-card-name">${this.escapeHtml(s.name || 'Unnamed')}</h3>
              </div>
              <div class="student-card-badges">
                ${cgpaBadge}
              </div>
            </div>

            <div class="student-card-badges">
              ${s.regNo ? `<span class="badge-neutral" style="font-weight:700;">${this.escapeHtml(s.regNo)}</span>` : ''}
              ${campusBadge}
            </div>

            <div class="student-card-body">
              ${s.degree ? `
                <div class="card-detail-item">
                  <span class="card-detail-label">Degree:</span>
                  <span class="card-detail-val">${this.escapeHtml(s.degree)}</span>
                </div>` : ''}
              ${s.email ? `
                <div class="card-detail-item">
                  <span class="card-detail-label">Email:</span>
                  <span class="card-detail-val">${this.escapeHtml(s.email)}</span>
                </div>` : ''}
              ${s.mobile ? `
                <div class="card-detail-item">
                  <span class="card-detail-label">Mobile:</span>
                  <span class="card-detail-val">${this.escapeHtml(s.mobile)}</span>
                </div>` : ''}
              ${(s.mark10 || s.mark12) ? `
                <div class="card-detail-item">
                  <span class="card-detail-label">10th / 12th:</span>
                  <span class="card-detail-val">${s.mark10 || '-'}% / ${s.mark12 || '-'}%</span>
                </div>` : ''}
            </div>

            <div class="student-card-footer">
              ${s.resumeUrl ? `
                <a href="${this.escapeHtml(s.resumeUrl)}" target="_blank" rel="noopener noreferrer" class="btn-card-action btn-card-resume" title="Open Resume">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Resume
                </a>` : ''}
              ${s.mobile ? `
                <a href="tel:${this.escapeHtml(s.mobile)}" class="btn-card-action" title="Call">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call
                </a>
                <a href="https://wa.me/91${this.escapeHtml(s.mobile)}" target="_blank" rel="noopener noreferrer" class="btn-card-action" title="WhatsApp">
                  WhatsApp
                </a>` : ''}
              <button class="btn-card-action" onclick="App.openStudentModal('${this.escapeHtml(s.neoId)}')" title="Details">
                Details
              </button>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = cardsHtml;
    },

    // Student Detail Modal
    openStudentModal: function (neoId) {
      const student = this.database[neoId];
      if (!student) return;

      document.getElementById('modal-neoid').textContent = `Neo ID: ${student.neoId}`;
      document.getElementById('modal-student-name').textContent = student.name || 'Unnamed Student';

      const body = document.getElementById('modal-student-body');
      body.innerHTML = `
        <div class="student-detail-grid">
          <div class="detail-block">
            <span class="detail-block-label">Registration Number</span>
            <span class="detail-block-value">${this.escapeHtml(student.regNo || '-')}</span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">UG Mark / CGPA</span>
            <span class="detail-block-value">
              ${student.cgpa ? `<span class="badge-cgpa ${this.getCgpaClass(student.cgpa)}">${student.cgpa}</span>` : '-'}
            </span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">Assigned Venue</span>
            <span class="detail-block-value">
              ${student.venue ? `<span class="badge-venue">${student.venue}</span>` : 'No venue assigned'}
            </span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">Campus</span>
            <span class="detail-block-value">${this.escapeHtml(student.campus || '-')}</span>
          </div>
          <div class="detail-block" style="grid-column: span 2;">
            <span class="detail-block-label">Degree & Specialization</span>
            <span class="detail-block-value">${this.escapeHtml(student.degree || '-')}</span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">Email Address</span>
            <span class="detail-block-value">
              ${student.email ? `<a href="mailto:${student.email}" class="link-neutral">${student.email}</a>` : '-'}
            </span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">Mobile Number</span>
            <span class="detail-block-value">
              ${student.mobile ? `<a href="tel:${student.mobile}" class="link-neutral">${student.mobile}</a>` : '-'}
            </span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">Gender</span>
            <span class="detail-block-value">${this.escapeHtml(student.gender || '-')}</span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">Date of Birth</span>
            <span class="detail-block-value">${this.escapeHtml(student.dob || '-')}</span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">10th Mark</span>
            <span class="detail-block-value">${student.mark10 ? student.mark10 + '%' : '-'}</span>
          </div>
          <div class="detail-block">
            <span class="detail-block-label">12th Mark</span>
            <span class="detail-block-value">${student.mark12 ? student.mark12 + '%' : '-'}</span>
          </div>
        </div>
      `;

      const footer = document.getElementById('modal-student-footer');
      footer.innerHTML = `
        ${student.resumeUrl ? `
          <a href="${this.escapeHtml(student.resumeUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Open Resume
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : ''}
        ${student.mobile ? `
          <a href="tel:${this.escapeHtml(student.mobile)}" class="btn btn-secondary btn-sm">
            Call
          </a>` : ''}
        <button type="button" class="btn btn-secondary btn-sm" onclick="App.copyStudentDetails('${this.escapeHtml(student.neoId)}')">
          Copy Info
        </button>
      `;

      document.getElementById('student-modal').classList.remove('hidden');
    },

    closeStudentModal: function () {
      document.getElementById('student-modal').classList.add('hidden');
    },

    copyStudentDetails: function (neoId) {
      const s = this.database[neoId];
      if (!s) return;
      const text = `Name: ${s.name}\nNeo ID: ${s.neoId}\nReg No: ${s.regNo}\nCGPA: ${s.cgpa}\nVenue: ${s.venue}\nCampus: ${s.campus}\nDegree: ${s.degree}\nMobile: ${s.mobile}\nEmail: ${s.email}\nResume: ${s.resumeUrl}`;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied student details to clipboard', 'success');
      });
    },

    // Export to Excel (.xlsx)
    exportToExcel: function () {
      if (this.filteredResults.length === 0) {
        this.showToast('No student data to export!', 'error');
        return;
      }

      if (typeof XLSX === 'undefined') {
        this.showToast('Excel library not ready. Please use CSV export.', 'error');
        return;
      }

      const rows = this.filteredResults.map(s => ({
        'Order': s.inputIndex,
        'Neo ID': s.neoId,
        'Full Name': s.name,
        'Registration Number': s.regNo,
        'CGPA / UG Mark': s.cgpa ? parseFloat(s.cgpa) || s.cgpa : '',
        'Venue': s.venue,
        'Campus': s.campus,
        'Degree & Specialization': s.degree,
        'Email': s.email,
        'Mobile Number': s.mobile,
        'Gender': s.gender,
        'Date of Birth': s.dob,
        '10th Mark': s.mark10,
        '12th Mark': s.mark12,
        'Resume URL': s.resumeUrl
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto column widths
      const colWidths = [
        { wch: 8 },  // Order
        { wch: 14 }, // Neo ID
        { wch: 28 }, // Full Name
        { wch: 16 }, // Reg No
        { wch: 16 }, // CGPA
        { wch: 12 }, // Venue
        { wch: 14 }, // Campus
        { wch: 38 }, // Degree
        { wch: 30 }, // Email
        { wch: 16 }, // Mobile
        { wch: 10 }, // Gender
        { wch: 14 }, // DOB
        { wch: 12 }, // 10th
        { wch: 12 }, // 12th
        { wch: 45 }  // Resume URL
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `NeoPat_Students_Export_${dateStr}.xlsx`);
      this.showToast(`Exported ${rows.length} student records to Excel!`, 'success');
    },

    // Export to CSV
    exportToCSV: function () {
      if (this.filteredResults.length === 0) {
        this.showToast('No student data to export!', 'error');
        return;
      }

      const headers = ['Order', 'Neo ID', 'Full Name', 'Registration Number', 'CGPA', 'Venue', 'Campus', 'Degree & Specialization', 'Email', 'Mobile Number', 'Gender', 'Date of Birth', '10th Mark', '12th Mark', 'Resume URL'];

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const csvRows = [headers.join(',')];

      this.filteredResults.forEach(s => {
        const row = [
          s.inputIndex,
          escapeCSV(s.neoId),
          escapeCSV(s.name),
          escapeCSV(s.regNo),
          escapeCSV(s.cgpa),
          escapeCSV(s.venue),
          escapeCSV(s.campus),
          escapeCSV(s.degree),
          escapeCSV(s.email),
          escapeCSV(s.mobile),
          escapeCSV(s.gender),
          escapeCSV(s.dob),
          escapeCSV(s.mark10),
          escapeCSV(s.mark12),
          escapeCSV(s.resumeUrl)
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NeoPat_Students_Export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast(`Exported ${this.filteredResults.length} records to CSV!`, 'success');
    },

    // Copy Tab-Separated Table to Clipboard (For instant pasting into Excel)
    copyTableToClipboard: function () {
      if (this.filteredResults.length === 0) {
        this.showToast('No student data to copy!', 'error');
        return;
      }

      const headers = ['Order', 'Neo ID', 'Full Name', 'Reg No', 'CGPA', 'Campus', 'Degree', 'Mobile', 'Email', '10th %', '12th %', 'Resume URL'];
      const lines = [headers.join('\t')];

      this.filteredResults.forEach(s => {
        lines.push([
          s.inputIndex,
          s.neoId || '',
          s.name || '',
          s.regNo || '',
          s.cgpa || '',
          s.campus || '',
          s.degree || '',
          s.mobile || '',
          s.email || '',
          s.mark10 || '',
          s.mark12 || '',
          s.resumeUrl || ''
        ].join('\t'));
      });

      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        this.showToast(`Copied ${this.filteredResults.length} records! You can now paste (Ctrl+V) directly into Excel or Google Sheets.`, 'success');
      }).catch(() => {
        this.showToast('Clipboard access was blocked.', 'error');
      });
    },

    // Upload & Import Custom Database
    openUploadModal: function () {
      document.getElementById('upload-status').classList.add('hidden');
      document.getElementById('upload-modal').classList.remove('hidden');
    },

    closeUploadModal: function () {
      document.getElementById('upload-modal').classList.add('hidden');
    },

    initDropzone: function () {
      const dropzone = document.getElementById('upload-dropzone');
      const fileInput = document.getElementById('file-input-excel');
      const self = this;

      if (!dropzone || !fileInput) return;

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          self.handleFileUpload(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          self.handleFileUpload(e.target.files[0]);
        }
      });
    },

    handleFileUpload: function (file) {
      const self = this;
      const statusDiv = document.getElementById('upload-status');
      statusDiv.className = 'upload-status alert-amber';
      statusDiv.textContent = `Reading ${file.name}...`;
      statusDiv.classList.remove('hidden');

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          if (!jsonRows || jsonRows.length === 0) {
            statusDiv.className = 'upload-status alert-amber';
            statusDiv.textContent = 'Uploaded file is empty.';
            return;
          }

          let updatedCount = 0;
          let addedCount = 0;

          // Detect columns
          jsonRows.forEach(row => {
            // Find Neo ID column
            let neoId = '';
            for (let k in row) {
              const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              if (cleanK === 'neoid' || cleanK === 'neopatid') {
                neoId = String(row[k]).trim().toUpperCase();
                break;
              }
            }

            if (!neoId) return;

            // Existing student or new
            const existing = self.database[neoId] || {
              neoId: neoId,
              regNo: '',
              name: '',
              email: '',
              mobile: '',
              gender: '',
              dob: '',
              campus: '',
              degree: '',
              mark10: '',
              mark12: '',
              cgpa: '',
              resumeUrl: '',
              venue: ''
            };

            const isNew = !self.database[neoId];

            for (let k in row) {
              const val = String(row[k]).trim();
              const cleanK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

              if (cleanK.includes('venue') || cleanK === 'room') {
                existing.venue = val;
              } else if (cleanK.includes('name') && !cleanK.includes('campus')) {
                if (val) existing.name = val;
              } else if (cleanK.includes('reg') || cleanK.includes('roll')) {
                if (val) existing.regNo = val.toUpperCase();
              } else if (cleanK.includes('cgpa') || cleanK.includes('ugmark')) {
                if (val) existing.cgpa = val;
              } else if (cleanK.includes('campus')) {
                if (val) existing.campus = val;
              } else if (cleanK.includes('degree') || cleanK.includes('branch')) {
                if (val) existing.degree = val;
              } else if (cleanK.includes('email')) {
                if (val) existing.email = val;
              } else if (cleanK.includes('mobile') || cleanK.includes('phone')) {
                if (val) existing.mobile = val.replace(/\.0$/, '');
              } else if (cleanK.includes('resume')) {
                if (val) existing.resumeUrl = val;
              }
            }

            self.database[neoId] = existing;
            if (isNew) addedCount++;
            else updatedCount++;
          });

          // Save to LocalStorage
          try {
            localStorage.setItem('CUSTOM_STUDENTS_DATABASE', JSON.stringify(self.database));
          } catch (storageErr) {
            console.warn('LocalStorage quota reached, saved in-memory only.');
          }

          self.updateDbStats('Custom');
          statusDiv.className = 'upload-status alert-box alert-amber';
          statusDiv.style.backgroundColor = 'var(--emerald-subtle)';
          statusDiv.style.color = 'var(--emerald-text)';
          statusDiv.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          statusDiv.textContent = `Success! Processed ${jsonRows.length} rows: ${addedCount} new students added, ${updatedCount} existing records updated. Total database: ${Object.keys(self.database).length} records.`;
          self.showToast('Database successfully updated!', 'success');

        } catch (err) {
          console.error(err);
          statusDiv.className = 'upload-status alert-amber';
          statusDiv.textContent = `Error reading file: ${err.message}`;
        }
      };

      reader.readAsArrayBuffer(file);
    },

    resetDefaultDatabase: function () {
      if (confirm('Are you sure you want to reset to the default 4,351 student records?')) {
        localStorage.removeItem('CUSTOM_STUDENTS_DATABASE');
        this.database = window.DEFAULT_STUDENTS_DATABASE || {};
        this.updateDbStats();
        this.showToast('Reset to original default database', 'info');
        this.closeUploadModal();
        if (this.currentResults.length > 0) {
          this.fetchDetails();
        }
      }
    },

    // Utilities
    escapeHtml: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    showToast: function (msg, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = msg;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }, 3200);
    }
  };

  // Expose to window for inline onclick handlers
  window.App = App;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

})();
