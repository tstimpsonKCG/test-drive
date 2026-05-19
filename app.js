const canvas = document.getElementById("canvas");
const insights = document.getElementById("insights");
const insightsCanvas = document.getElementById("insights-canvas");
const template = document.getElementById("widget-template");
const headerFilterTemplate = document.getElementById("header-filter-template");
const targetArea = document.getElementById("target-area");
const targetAreaChoices = document.querySelectorAll('input[name="target-area-choice"]');
const toggleInsights = document.getElementById("toggle-insights");
const pageBody = document.querySelector(".page-body");
const uxPage = document.querySelector(".ux-page");
const canvasOverflowWarning = document.getElementById("canvas-overflow-warning");
const contextFilterRow = document.getElementById("context-filter-row");
const addHeaderFilterButton = document.getElementById("add-header-filter");
const exportPdfBtn = document.getElementById("export-pdf");
const appShell = document.querySelector(".app-shell");
const builderToggle = document.getElementById("builder-toggle");
const detailsModal = document.getElementById("widget-details-modal");
const closeDetailsModal = document.getElementById("close-details-modal");
const cancelDetails = document.getElementById("cancel-details");
const saveDetails = document.getElementById("save-details");
const pageDetailsModal = document.getElementById("page-details-modal");
const closePageDetailsModal = document.getElementById("close-page-details-modal");
const cancelPageDetails = document.getElementById("cancel-page-details");
const savePageDetails = document.getElementById("save-page-details");
const renamePageModal = document.getElementById("rename-page-modal");
const closeRenamePageModal = document.getElementById("close-rename-page-modal");
const cancelRenamePage = document.getElementById("cancel-rename-page");
const saveRenamePage = document.getElementById("save-rename-page");
const renamePageInput = document.getElementById("rename-page-input");
const pageSelect = document.getElementById("page-select");
const shellPageMenuButton = document.getElementById("shell-page-menu-button");
const shellPageMenu = document.getElementById("shell-page-menu");
const guideModal = document.getElementById("guide-modal");
const openGuideBtn = document.getElementById("open-guide");
const closeGuideModal = document.getElementById("close-guide-modal");
const dismissGuideModal = document.getElementById("dismiss-guide-modal");
const savePageBtn = document.getElementById("save-page");
const newPageBtn = document.getElementById("new-page");
const duplicatePageBtn = document.getElementById("duplicate-page");
const renamePageBtn = document.getElementById("rename-page");
const pageDetailsBtn = document.getElementById("page-details");
const deletePageBtn = document.getElementById("delete-page");
const exportBuildBriefBtn = document.getElementById("export-build-brief");
const exportProjectBtn = document.getElementById("export-project");
const importProjectBtn = document.getElementById("import-project");
const importProjectFile = document.getElementById("import-project-file");
const shellAppName = document.querySelector(".shell-app-selector .shell-editable");
const shellCategoryName = document.querySelector(".shell-category-editable");
const shellPageName = document.querySelector(".shell-page-editable");
const workspaceName = document.querySelector(".workspace-selector span:first-child");
const pageTitle = document.querySelector(".left-context");
const insightsTitle = document.querySelector(".insights h3");
const detailFields = {
  purpose: document.getElementById("detail-purpose"),
  source: document.getElementById("detail-source"),
  grain: document.getElementById("detail-grain"),
  editability: document.getElementById("detail-editability"),
  inputs: document.getElementById("detail-inputs"),
  outputs: document.getElementById("detail-outputs"),
  assumptions: document.getElementById("detail-assumptions"),
  openQuestions: document.getElementById("detail-open-questions"),
  notes: document.getElementById("detail-notes"),
};
const pageDetailFields = {
  functionalArea: document.getElementById("page-functional-area"),
  persona: document.getElementById("page-persona"),
  purpose: document.getElementById("page-purpose"),
};

let z = 5;
let counter = 1;
let activeDetailsWidget = null;
let project = null;
let isRestoring = false;
let saveTimer = null;
let activeGridCell = null;
let gridSelectionAnchor = null;
let gridSelectionRange = null;
let isSelectingGridRange = false;
const APP_VERSION = "0.1.9";
const STORAGE_KEY = "karta-anaplan-mockup-project-v018";
const GRID_SIZE = 14;
const CANVAS_GAP = GRID_SIZE;
const MIN_WIDGET_WIDTH = 168;
const MIN_WIDGET_HEIGHT = 70;
const MIN_COMPACT_WIDGET_HEIGHT = 42;
const EXPANDED_CANVAS_HEIGHT = 1260;
const EXPORT_WIDTH = 1600;
const EXPORT_HEIGHT = 900;
const DEFAULT_PAGE_PATH = "[Category Name] / [Page Name]";

document.querySelectorAll(".controls button[data-widget]").forEach((btn) => {
  btn.addEventListener("click", () => addWidget(btn.dataset.widget));
});

targetAreaChoices.forEach((choice) => {
  choice.addEventListener("change", () => {
    if (!choice.checked) return;
    targetArea.value = choice.value;
  });
});

document.getElementById("clear-canvas").addEventListener("click", () => {
  if (!confirm("Clear all cards and header filters on this page?")) return;
  canvas.innerHTML = "";
  insightsCanvas.innerHTML = "";
  contextFilterRow.innerHTML = "";
  updateHeaderFilterState();
  counter = 1;
  z = 5;
  updateCanvasOverflowWarning();
  saveActivePageNow();
});

exportPdfBtn.addEventListener("click", exportUxToPdf);
addHeaderFilterButton.addEventListener("click", () => addHeaderFilter());
closeDetailsModal.addEventListener("click", closeWidgetDetailsModal);
cancelDetails.addEventListener("click", closeWidgetDetailsModal);
detailsModal.addEventListener("cancel", closeWidgetDetailsModal);
saveDetails.addEventListener("click", saveWidgetDetails);
closePageDetailsModal.addEventListener("click", closePageDetailsDialog);
cancelPageDetails.addEventListener("click", closePageDetailsDialog);
pageDetailsModal.addEventListener("cancel", closePageDetailsDialog);
savePageDetails.addEventListener("click", savePageDetailsMetadata);
openGuideBtn.addEventListener("click", openGuideDialog);
closeGuideModal.addEventListener("click", closeGuideDialog);
dismissGuideModal.addEventListener("click", closeGuideDialog);
guideModal.addEventListener("cancel", closeGuideDialog);
closeRenamePageModal.addEventListener("click", closeRenamePageDialog);
cancelRenamePage.addEventListener("click", closeRenamePageDialog);
renamePageModal.addEventListener("cancel", closeRenamePageDialog);
saveRenamePage.addEventListener("click", saveRenamePageName);

builderToggle.addEventListener("click", () => {
  const collapsed = appShell.classList.toggle("builder-collapsed");
  builderToggle.setAttribute("aria-expanded", String(!collapsed));
  builderToggle.textContent = collapsed ? "Show Controls" : "Hide Controls";
});

toggleInsights.addEventListener("click", () => {
  const nowHidden = !insights.classList.contains("hidden");
  setInsightsHidden(nowHidden);

  if (nowHidden && targetArea.value === "insights") {
    targetArea.value = "canvas";
    syncTargetAreaChoices();
  }

  scheduleAutoSave();
});

savePageBtn.addEventListener("click", () => {
  saveActivePageNow();
  savePageBtn.textContent = "Saved";
  window.setTimeout(() => {
    savePageBtn.textContent = "Save Page";
  }, 900);
});

if (pageSelect) {
  pageSelect.addEventListener("change", () => {
    switchToPage(pageSelect.value);
  });
}

shellPageMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleShellPageMenu();
});

shellPageMenu.addEventListener("click", (event) => {
  const item = event.target.closest("[data-page-id]");
  if (!item) return;
  switchToPage(item.dataset.pageId);
  closeShellPageMenu();
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".shell-page-selector")) return;
  closeShellPageMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeShellPageMenu();
});

document.addEventListener("keydown", handleGridKeyboardNavigation, true);
document.addEventListener("copy", handleGridCopy);
document.addEventListener("mouseup", () => {
  isSelectingGridRange = false;
});

newPageBtn.addEventListener("click", () => {
  saveActivePageNow();
  const page = createDefaultPage(getUniquePageName("New Page"));
  project.pages.push(page);
  project.activePageId = page.id;
  renderPageSelect();
  restorePage(page);
  persistProject();
});

duplicatePageBtn.addEventListener("click", () => {
  saveActivePageNow();
  const source = getActivePage();
  const copy = structuredCloneSafe(source);
  copy.id = createId("page");
  copy.name = getUniquePageName(`${source.name || "Page"} Copy`);
  copy.updatedAt = new Date().toISOString();
  project.pages.push(copy);
  project.activePageId = copy.id;
  renderPageSelect();
  restorePage(copy);
  persistProject();
});

renamePageBtn.addEventListener("click", () => {
  const page = getActivePage();
  renamePageInput.value = page.name || "Untitled Page";
  if (typeof renamePageModal.showModal === "function") {
    renamePageModal.showModal();
    renamePageInput.select();
  } else {
    renamePageModal.setAttribute("open", "");
    renamePageInput.focus();
  }
});

pageDetailsBtn.addEventListener("click", openPageDetailsDialog);

deletePageBtn.addEventListener("click", () => {
  if (project.pages.length <= 1) {
    alert("Keep at least one page in the project.");
    return;
  }

  const page = getActivePage();
  if (!confirm(`Delete "${page.name}" from this local project?`)) return;

  project.pages = project.pages.filter((candidate) => candidate.id !== page.id);
  project.activePageId = project.pages[0].id;
  renderPageSelect();
  restorePage(getActivePage());
  persistProject();
});

exportBuildBriefBtn.addEventListener("click", exportBuildBriefCsv);

exportProjectBtn.addEventListener("click", () => {
  saveActivePageNow();
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(project.name || "mockup-project")}-v${APP_VERSION}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

importProjectBtn.addEventListener("click", () => {
  importProjectFile.click();
});

importProjectFile.addEventListener("change", () => {
  const [file] = importProjectFile.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = normalizeProject(JSON.parse(reader.result));
      project = imported;
      renderPageSelect();
      restorePage(getActivePage());
      persistProject();
    } catch (error) {
      alert("Import failed. Choose a valid mockup project JSON file.");
      console.error(error);
    } finally {
      importProjectFile.value = "";
    }
  });
  reader.readAsText(file);
});

document.addEventListener("input", (event) => {
  if (isRestoring) return;
  if (event.target.closest(".mockup-frame")) {
    scheduleAutoSave();
    if (event.target === pageTitle || event.target === shellPageName) {
      syncActivePageName();
    }
  }
});

document.addEventListener("change", (event) => {
  if (isRestoring) return;
  if (event.target.closest(".mockup-frame")) {
    scheduleAutoSave();
  }
});

window.addEventListener("resize", updateCanvasOverflowWarning);
window.addEventListener("beforeunload", saveActivePageNow);

ensureGridSelectionStyles();
initProject();

async function exportUxToPdf() {
  const frame = document.querySelector(".mockup-frame");
  const pdfApi = window.jspdf;

  if (!frame || typeof window.html2canvas !== "function" || !pdfApi?.jsPDF) {
    alert("PDF export is not ready. Check your connection and try again.");
    return;
  }

  exportPdfBtn.disabled = true;
  exportPdfBtn.textContent = "Generating PDF...";
  document.body.classList.add("pdf-exporting");

  try {
    const canvasImage = await window.html2canvas(frame, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      windowWidth: EXPORT_WIDTH,
      windowHeight: EXPORT_HEIGHT,
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
    });
    const pdf = new pdfApi.jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [EXPORT_WIDTH, EXPORT_HEIGHT],
      hotfixes: ["px_scaling"],
    });

    pdf.addImage(canvasImage.toDataURL("image/png"), "PNG", 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    pdf.save(`${slugify(getActivePage()?.name || "anaplan-mockup")}.pdf`);
  } catch (error) {
    alert("PDF export failed. Please try again.");
    console.error(error);
  } finally {
    document.body.classList.remove("pdf-exporting");
    exportPdfBtn.disabled = false;
    exportPdfBtn.textContent = "Export UX Mockup PDF";
  }
}

function exportBuildBriefCsv() {
  saveActivePageNow();
  const columns = [
    "Page name",
    "Functional area",
    "Persona",
    "Page purpose",
    "Global selectors",
    "Card name",
    "Card type",
    "Source module",
    "Grain",
    "Editable?",
    "Inputs",
    "Outputs",
    "Open questions",
    "Build notes",
  ];
  const rows = project.pages.flatMap((page) => {
    const metadata = getPageMetadata(page);
    const globalSelectors = getGlobalSelectorLabels(page).join(", ");
    return getPageBuildBriefCards(page).map((card) => {
      const cardMetadata = {
        purpose: "",
        source: "",
        grain: "",
        editability: "",
        inputs: "",
        outputs: "",
        assumptions: "",
        openQuestions: "",
        notes: "",
        filters: [],
        ...(card.metadata || {}),
      };

      return [
        page.name || "",
        metadata.functionalArea || "",
        metadata.persona || "",
        metadata.purpose || "",
        globalSelectors,
        getCardName(card),
        getCardTypeLabel(card, cardMetadata),
        cardMetadata.source || "",
        cardMetadata.grain || "",
        cardMetadata.editability || "",
        cardMetadata.inputs || "",
        cardMetadata.outputs || "",
        cardMetadata.openQuestions || "",
        cardMetadata.notes || "",
      ];
    });
  });

  const csv = [columns, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
  downloadBlob(
    `\uFEFF${csv}`,
    `${slugify(project.name || "mockup-project")}-build-brief-v${APP_VERSION}.csv`,
    "text/csv;charset=utf-8"
  );
}

function getGlobalSelectorLabels(page) {
  return (page.headerFilters || [])
    .map((filter) => filter.label || "")
    .map((label) => label.trim())
    .filter(Boolean);
}

function getPageBuildBriefCards(page) {
  return [...(page.mainCards || []), ...(page.insightCards || [])];
}

function getCardName(card) {
  const headerName = getCardHeaderText(card.headerHTML || "");
  if (headerName) return headerName;
  return getTextFromHtml(card.contentHTML || "");
}

function getCardHeaderText(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const gridTitle = wrapper.querySelector(".grid-title");
  if (gridTitle?.textContent.trim()) return normalizeWhitespace(gridTitle.textContent);
  wrapper.querySelectorAll("button, .grid-controls").forEach((control) => control.remove());
  return normalizeWhitespace(wrapper.textContent);
}

function getTextFromHtml(html) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return normalizeWhitespace(wrapper.textContent);
}

function getCardTypeLabel(card, metadata) {
  if (card.type === "grid") {
    return metadata.editability ? `${metadata.editability} grid` : "Grid/table";
  }

  const labels = {
    kpi: "KPI",
    chart: "Chart",
    button: "Button",
    text: "Title/Header",
    checkbox: "Checkbox",
    field: "Field",
    textbox: "Text Box",
    logo: "Logo Placeholder",
  };
  return labels[card.type] || "Card";
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadBlob(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function addWidget(type) {
  const destination = getDestination();
  if (!destination) return;

  const widget = createWidget(type);
  const width = snapToGrid(getDefaultWidth(type));
  const height = snapToGrid(getDefaultHeight(type));
  widget.style.width = `${width}px`;
  widget.style.height = `${height}px`;
  widget.style.zIndex = ++z;
  wireWidget(widget, destination === insightsCanvas);
  destination.appendChild(widget);

  const isInsightsDestination = destination === insightsCanvas;
  if (isInsightsDestination) {
    prepareInsightsWidget(widget);
  } else {
    const position = findOpenPosition(destination, widget, width, height);
    if (!position) {
      widget.remove();
      alert("There is not enough open space in the main canvas for that card.");
      return;
    }
    applyRect(widget, position);
  }

  counter += 1;
  updateCanvasOverflowWarning();
  saveActivePageNow();
}

function createWidget(type) {
  const widget = template.content.firstElementChild.cloneNode(true);
  widget.dataset.type = type;
  widget.dataset.widgetId = `widget-${counter}`;

  const title = widget.querySelector(".widget-header");
  const content = widget.querySelector(".widget-content");

  if (type === "kpi") {
    title.textContent = "KPI: Net New ARR";
    content.innerHTML = `
      <div class="kpi">
        <div class="value" contenteditable="true">$1.42M</div>
        <div class="delta" contenteditable="true">+8.4% vs Plan</div>
        <div contenteditable="true">Driver: Enterprise Wins</div>
      </div>
    `;
  }

  if (type === "grid") {
    title.contentEditable = "false";
    title.innerHTML = `
      <span class="grid-title" contenteditable="true">Grid: Monthly Forecast</span>
      <span class="grid-controls" aria-label="Grid controls">
        <button data-grid-action="add-row" type="button" title="Add row">+ Row</button>
        <button data-grid-action="remove-row" type="button" title="Remove row">- Row</button>
        <button data-grid-action="add-column" type="button" title="Add column">+ Col</button>
        <button data-grid-action="remove-column" type="button" title="Remove column">- Col</button>
      </span>
    `;
    content.innerHTML = `
      <table class="grid-table">
        <thead>
          <tr><th contenteditable="true">BU</th><th contenteditable="true">Jan</th><th contenteditable="true">Feb</th><th contenteditable="true">Mar</th></tr>
        </thead>
        <tbody>
          <tr><td contenteditable="true">Enterprise</td><td contenteditable="true">120</td><td contenteditable="true">132</td><td contenteditable="true">141</td></tr>
          <tr><td contenteditable="true">Mid Market</td><td contenteditable="true">88</td><td contenteditable="true">91</td><td contenteditable="true">96</td></tr>
          <tr><td contenteditable="true">SMB</td><td contenteditable="true">46</td><td contenteditable="true">49</td><td contenteditable="true">53</td></tr>
        </tbody>
      </table>
    `;
  }

  if (type === "chart") {
    title.textContent = "Chart: Revenue by Quarter";
    content.innerHTML = `
      <div class="chart">
        <div class="bar" style="height:45%"></div>
        <div class="bar" style="height:70%"></div>
        <div class="bar" style="height:60%"></div>
        <div class="bar" style="height:82%"></div>
      </div>
    `;
  }

  if (type === "button") {
    title.remove();
    content.innerHTML = `
      <button class="mock-action-btn" type="button" contenteditable="true">Submit Forecast</button>
    `;
    widget.classList.add("bare-widget", "button-widget");
  }

  if (type === "text") {
    title.remove();
    content.innerHTML = `
      <div class="text-widget" contenteditable="true">Section Header / Instructional Text</div>
    `;
    widget.classList.add("bare-widget", "text-only-widget");
  }

  if (type === "checkbox") {
    title.remove();
    content.innerHTML = `
      <label class="checkbox-widget-content">
        <span class="mock-checkbox" contenteditable="false"></span>
        <span class="checkbox-label" contenteditable="true">Show Active Projects</span>
      </label>
    `;
    widget.classList.add("bare-widget", "checkbox-widget");
  }

  if (type === "field") {
    title.remove();
    content.innerHTML = `
      <div class="field-widget-content">
        <div class="field-title" contenteditable="true">Current Forecast</div>
        <div class="field-box" contenteditable="true">Working Forecast</div>
      </div>
    `;
    widget.classList.add("field-widget");
  }

  if (type === "textbox") {
    title.remove();
    content.innerHTML = `
      <div class="textbox-widget-content" contenteditable="true">Add workshop note or descriptive text...</div>
    `;
    widget.classList.add("textbox-widget");
  }

  if (type === "logo") {
    title.remove();
    content.innerHTML = `
      <div class="logo-placeholder-card" contenteditable="true">
        <span>Client Logo</span>
      </div>
    `;
    widget.classList.add("logo-widget");
  }

  setupWidgetMetadata(widget);
  return widget;
}

function wireWidget(widget, isInsightsDestination) {
  setupWidgetChrome(widget);
  setupGridControls(widget);
  setupGridPasteSupport(widget);
  setupGridRangeSelection(widget);
  setupGridKeyboardNavigation(widget);
  setupGridCheckboxConversion(widget);
  makeDraggable(widget, isInsightsDestination ? insightsCanvas : canvas, isInsightsDestination);
  makeResizable(widget, isInsightsDestination ? insightsCanvas : canvas, isInsightsDestination);
  updateWidgetMetadataState(widget);
}

function setupWidgetMetadata(widget, metadata = null) {
  widget._buildMetadata = {
    purpose: "",
    source: "",
    grain: "",
    editability: "",
    inputs: "",
    outputs: "",
    assumptions: "",
    openQuestions: "",
    notes: "",
    filters: [],
    ...(metadata || {}),
  };
}

function setupWidgetChrome(widget) {
  widget.querySelector(".remove").addEventListener("click", () => {
    widget.remove();
    updateCanvasOverflowWarning();
    saveActivePageNow();
  });

  widget.querySelector(".details").addEventListener("click", (event) => {
    event.stopPropagation();
    openWidgetDetailsModal(widget);
  });

  widget.querySelector(".add-widget-filter").addEventListener("click", (event) => {
    event.stopPropagation();
    addWidgetFilter(widget);
  });
}

function openWidgetDetailsModal(widget) {
  activeDetailsWidget = widget;
  const metadata = getWidgetMetadata(widget);

  Object.entries(detailFields).forEach(([key, field]) => {
    field.value = metadata[key] || "";
  });

  if (typeof detailsModal.showModal === "function") {
    detailsModal.showModal();
  } else {
    detailsModal.setAttribute("open", "");
  }
}

function closeWidgetDetailsModal() {
  activeDetailsWidget = null;
  if (detailsModal.open) {
    detailsModal.close();
  } else {
    detailsModal.removeAttribute("open");
  }
}

function openPageDetailsDialog() {
  saveActivePageNow();
  const page = getActivePage();
  const metadata = getPageMetadata(page);

  Object.entries(pageDetailFields).forEach(([key, field]) => {
    field.value = metadata[key] || "";
  });

  if (typeof pageDetailsModal.showModal === "function") {
    pageDetailsModal.showModal();
  } else {
    pageDetailsModal.setAttribute("open", "");
  }
}

function closePageDetailsDialog() {
  if (pageDetailsModal.open) {
    pageDetailsModal.close();
  } else {
    pageDetailsModal.removeAttribute("open");
  }
}

function openGuideDialog() {
  if (typeof guideModal.showModal === "function") {
    guideModal.showModal();
  } else {
    guideModal.setAttribute("open", "");
  }
}

function closeGuideDialog() {
  if (guideModal.open) {
    guideModal.close();
  } else {
    guideModal.removeAttribute("open");
  }
}

function closeRenamePageDialog() {
  if (renamePageModal.open) {
    renamePageModal.close();
  } else {
    renamePageModal.removeAttribute("open");
  }
}

function savePageDetailsMetadata(event) {
  event.preventDefault();
  const page = getActivePage();
  const metadata = getPageMetadata(page);

  Object.entries(pageDetailFields).forEach(([key, field]) => {
    metadata[key] = field.value.trim();
  });

  saveActivePageNow();
  closePageDetailsDialog();
}

function saveRenamePageName(event) {
  event.preventDefault();
  const page = getActivePage();
  const nextName = renamePageInput.value.trim();
  if (!nextName) return;

  page.name = nextName;
  pageTitle.textContent = nextName;
  shellPageName.textContent = nextName;
  saveActivePageNow();
  renderPageSelect();
  closeRenamePageDialog();
}

function saveWidgetDetails(event) {
  event.preventDefault();
  if (!activeDetailsWidget) return;

  const metadata = getWidgetMetadata(activeDetailsWidget);
  Object.entries(detailFields).forEach(([key, field]) => {
    metadata[key] = field.value.trim();
  });

  updateWidgetMetadataState(activeDetailsWidget);
  closeWidgetDetailsModal();
  saveActivePageNow();
}

function getWidgetMetadata(widget) {
  if (!widget._buildMetadata) setupWidgetMetadata(widget);
  return widget._buildMetadata;
}

function getPageMetadata(page) {
  if (!page.metadata) page.metadata = createDefaultPageMetadata();
  page.metadata = {
    ...createDefaultPageMetadata(),
    ...page.metadata,
  };
  return page.metadata;
}

function updateWidgetMetadataState(widget) {
  const metadata = getWidgetMetadata(widget);
  const hasDetails = [
    "purpose",
    "source",
    "grain",
    "editability",
    "inputs",
    "outputs",
    "assumptions",
    "openQuestions",
    "notes",
  ].some((key) => metadata[key]);
  widget.classList.toggle("has-widget-details", hasDetails);
}

function addWidgetFilter(widget, name = "Filter") {
  const list = widget.querySelector(".widget-filter-list");
  const chip = document.createElement("span");
  chip.className = "widget-filter-chip";
  chip.innerHTML = `
    <span class="widget-filter-name" contenteditable="true"></span>
    <button class="remove-widget-filter" type="button" aria-label="Remove widget filter">×</button>
  `;
  chip.querySelector(".widget-filter-name").textContent = name;

  chip.querySelector(".remove-widget-filter").addEventListener("click", () => {
    chip.remove();
    syncWidgetFilters(widget);
    saveActivePageNow();
  });

  chip.querySelector(".widget-filter-name").addEventListener("input", () => {
    syncWidgetFilters(widget);
    scheduleAutoSave();
  });

  list.appendChild(chip);
  syncWidgetFilters(widget);
  saveActivePageNow();
}

function syncWidgetFilters(widget) {
  const metadata = getWidgetMetadata(widget);
  metadata.filters = Array.from(widget.querySelectorAll(".widget-filter-name"))
    .map((filter) => filter.textContent.trim())
    .filter(Boolean);
}

function prepareInsightsWidget(widget) {
  widget.classList.add("insights-widget");
  widget.style.left = "0px";
  widget.style.top = "0px";
  widget.style.width = "100%";

  const handle = widget.querySelector(".resize-handle");
  handle.style.display = "none";

  const header = widget.querySelector(".widget-header");
  if (header) header.style.marginBottom = "6px";
}

function addHeaderFilter(label = "Filter") {
  const chip = headerFilterTemplate.content.firstElementChild.cloneNode(true);
  chip.querySelector(".filter-label").textContent = label;
  chip.querySelector(".remove-filter").addEventListener("click", () => {
    chip.remove();
    updateHeaderFilterState();
    saveActivePageNow();
  });
  contextFilterRow.appendChild(chip);
  updateHeaderFilterState();
  saveActivePageNow();
}

function updateHeaderFilterState() {
  contextFilterRow.classList.toggle("has-header-filters", contextFilterRow.children.length > 0);
}

function getDestination() {
  if (targetArea.value === "insights") {
    if (insights.classList.contains("hidden")) {
      alert("Additional Insights is hidden. Turn it on to place cards there.");
      return null;
    }
    return insightsCanvas;
  }
  return canvas;
}

function getDefaultWidth(type) {
  if (type === "kpi") return 224;
  if (type === "button") return 238;
  if (type === "checkbox") return 350;
  if (type === "field") return 300;
  if (type === "text") return 476;
  if (type === "textbox") return 360;
  if (type === "logo") return 238;
  return 308;
}

function getDefaultHeight(type) {
  if (type === "kpi") return 168;
  if (type === "button") return 56;
  if (type === "checkbox") return 56;
  if (type === "field") return 104;
  if (type === "text") return 56;
  if (type === "textbox") return 154;
  if (type === "logo") return 126;
  return 224;
}

function getMinWidgetHeight(el) {
  return el.classList.contains("bare-widget") ? MIN_COMPACT_WIDGET_HEIGHT : MIN_WIDGET_HEIGHT;
}

function makeDraggable(el, container, isInsightsDestination) {
  const handle = el.querySelector(".drag-handle");
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;
  let lastValidRect = null;
  let dragging = false;

  handle.addEventListener("mousedown", (e) => {
    if (isInsightsDestination) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    baseX = el.offsetLeft;
    baseY = el.offsetTop;
    lastValidRect = getElementRect(el);
    el.style.zIndex = ++z;
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging || isInsightsDestination) return;

    const nextRect = {
      x: snapToGrid(baseX + (e.clientX - startX)),
      y: snapToGrid(baseY + (e.clientY - startY)),
      width: el.offsetWidth,
      height: el.offsetHeight,
    };

    if (isRectValid(container, nextRect, el)) {
      lastValidRect = nextRect;
      applyRect(el, nextRect);
    } else if (lastValidRect) {
      applyRect(el, lastValidRect);
    }
  });

  window.addEventListener("mouseup", () => {
    if (dragging) {
      updateCanvasOverflowWarning();
      saveActivePageNow();
    }
    dragging = false;
    document.body.style.userSelect = "";
  });
}

function makeResizable(el, container, isInsightsDestination) {
  const handle = el.querySelector(".resize-handle");
  if (isInsightsDestination) return;

  let startX = 0;
  let startY = 0;
  let startW = 0;
  let startH = 0;
  let lastValidRect = null;
  let resizing = false;

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startW = el.offsetWidth;
    startH = el.offsetHeight;
    lastValidRect = getElementRect(el);
    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!resizing) return;

    const nextRect = {
      x: el.offsetLeft,
      y: el.offsetTop,
      width: Math.max(MIN_WIDGET_WIDTH, snapToGrid(startW + (e.clientX - startX))),
      height: Math.max(getMinWidgetHeight(el), snapToGrid(startH + (e.clientY - startY))),
    };

    if (isRectValid(container, nextRect, el)) {
      lastValidRect = nextRect;
      applyRect(el, nextRect);
    } else if (lastValidRect) {
      applyRect(el, lastValidRect);
    }
  });

  window.addEventListener("mouseup", () => {
    if (resizing) {
      updateCanvasOverflowWarning();
      saveActivePageNow();
    }
    resizing = false;
    document.body.style.userSelect = "";
  });
}

function ensureGridSelectionStyles() {
  if (document.getElementById("grid-selection-styles")) return;

  const style = document.createElement("style");
  style.id = "grid-selection-styles";
  style.textContent = `
    .grid-table th.selected-grid-cell,
    .grid-table td.selected-grid-cell {
      background: rgba(42, 101, 78, 0.16);
      box-shadow: inset 0 0 0 1px var(--karta-salem);
    }

    .grid-table th.active-grid-cell,
    .grid-table td.active-grid-cell {
      background: rgba(42, 101, 78, 0.22);
      box-shadow: inset 0 0 0 2px var(--karta-salem);
    }
  `;
  document.head.appendChild(style);
}

function setupGridControls(widget) {
  widget.querySelectorAll("[data-grid-action]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateGrid(widget, button.dataset.gridAction);
      saveActivePageNow();
    });
  });
}

function setupGridPasteSupport(widget) {
  const table = widget.querySelector(".grid-table");
  if (!table) return;

  table.addEventListener("click", (event) => {
    const cell = event.target.closest("th, td");
    if (!cell) return;

    if (event.shiftKey && gridSelectionAnchor?.closest(".grid-table") === table) {
      selectGridRange(gridSelectionAnchor, cell);
      return;
    }

    if (!isGridRangeMultiple(gridSelectionRange)) {
      setActiveGridCell(cell);
    }
  });

  table.addEventListener("focusin", (event) => {
    const cell = event.target.closest("th, td");
    if (!cell || isGridRangeMultiple(gridSelectionRange)) return;
    setActiveGridCell(cell);
  });

  table.addEventListener("paste", (event) => {
    const cell = event.target.closest("th, td") || activeGridCell;
    if (!cell || !table.contains(cell)) return;

    const clipboardText = event.clipboardData?.getData("text/plain") || "";
    if (!clipboardText) return;

    const pastedGrid = parseSpreadsheetPaste(clipboardText);

    event.preventDefault();
    if (isMultiCellPaste(pastedGrid)) {
      pasteSpreadsheetRange(table, cell, pastedGrid);
    } else {
      setGridCellValue(cell, pastedGrid[0]?.[0] || "", cell.tagName.toLowerCase() === "td");
    }
    setActiveGridCell(cell);
    saveActivePageNow();
  });
}

function setupGridRangeSelection(widget) {
  const table = widget.querySelector(".grid-table");
  if (!table) return;

  if (table.dataset.rangeSelectionReady === "true") return;
  table.dataset.rangeSelectionReady = "true";

  table.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;

    const cell = event.target.closest("th, td");
    if (!cell || !table.contains(cell)) return;

    if (event.shiftKey && gridSelectionAnchor?.closest(".grid-table") === table) {
      selectGridRange(gridSelectionAnchor, cell);
      return;
    }

    isSelectingGridRange = true;
    gridSelectionAnchor = cell;
    selectGridRange(cell, cell);
  });

  table.addEventListener("mouseover", (event) => {
    if (!isSelectingGridRange || !gridSelectionAnchor) return;

    const cell = event.target.closest("th, td");
    if (!cell || !table.contains(cell)) return;

    selectGridRange(gridSelectionAnchor, cell);
  });
}

function setupGridKeyboardNavigation(widget) {
  const table = widget.querySelector(".grid-table");
  if (!table) return;

  if (table.dataset.keyboardNavigationReady === "true") return;
  table.dataset.keyboardNavigationReady = "true";
  table.addEventListener("keydown", handleGridKeyboardNavigation, true);
}

function handleGridKeyboardNavigation(event) {
  if (event.isComposing) return;
  if (event.key !== "Tab" && event.key !== "Enter") return;

  const cell = getGridEventCell(event);
  const table = cell?.closest(".grid-table");
  if (!cell || !table) return;

  if (event.key === "Enter" && event.altKey) {
    event.preventDefault();
    event.stopImmediatePropagation();
    insertGridCellLineBreak(cell);
    scheduleAutoSave();
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const direction = event.shiftKey ? -1 : 1;
  const nextCell =
    event.key === "Tab"
      ? getGridCellByOffset(table, cell, 0, direction)
      : getGridCellByOffset(table, cell, direction, 0);

  if (!nextCell) return;

  focusGridCell(nextCell);
  scheduleAutoSave();
}

function setActiveGridCell(cell, options = {}) {
  if (!cell || !cell.matches("th, td")) return;
  if (!options.preserveSelection) {
    clearGridSelection();
    gridSelectionAnchor = cell;
  }

  if (activeGridCell && activeGridCell !== cell) {
    activeGridCell.classList.remove("active-grid-cell");
  }
  activeGridCell = cell;
  activeGridCell.classList.add("active-grid-cell");
}

function clearActiveGridCell() {
  if (activeGridCell) activeGridCell.classList.remove("active-grid-cell");
  activeGridCell = null;
  clearGridSelection();
}

function clearGridSelection() {
  document.querySelectorAll(".selected-grid-cell").forEach((cell) => {
    cell.classList.remove("selected-grid-cell");
  });
  gridSelectionRange = null;
  gridSelectionAnchor = null;
}

function selectGridRange(startCell, endCell) {
  const range = getNormalizedGridRange(startCell, endCell);
  if (!range) return;

  document.querySelectorAll(".selected-grid-cell").forEach((cell) => {
    cell.classList.remove("selected-grid-cell");
  });

  gridSelectionRange = range;
  gridSelectionAnchor = startCell;
  setActiveGridCell(startCell, { preserveSelection: true });

  for (let rowIndex = range.startRow; rowIndex <= range.endRow; rowIndex += 1) {
    const row = range.rows[rowIndex];
    for (let columnIndex = range.startColumn; columnIndex <= range.endColumn; columnIndex += 1) {
      row[columnIndex]?.classList.add("selected-grid-cell");
    }
  }
}

function getNormalizedGridRange(startCell, endCell) {
  const table = startCell?.closest(".grid-table");
  if (!table || !endCell || endCell.closest(".grid-table") !== table) return null;

  const rows = getGridNavigationRows(table);
  const startPosition = getGridCellPosition(rows, startCell);
  const endPosition = getGridCellPosition(rows, endCell);
  if (!startPosition || !endPosition) return null;

  return {
    table,
    rows,
    startRow: Math.min(startPosition.row, endPosition.row),
    endRow: Math.max(startPosition.row, endPosition.row),
    startColumn: Math.min(startPosition.column, endPosition.column),
    endColumn: Math.max(startPosition.column, endPosition.column),
  };
}

function getGridCellPosition(rows, cell) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const columnIndex = rows[rowIndex].indexOf(cell);
    if (columnIndex >= 0) return { row: rowIndex, column: columnIndex };
  }
  return null;
}

function isGridRangeMultiple(range) {
  if (!range) return false;
  return range.startRow !== range.endRow || range.startColumn !== range.endColumn;
}

function handleGridCopy(event) {
  const selection = window.getSelection();
  if (!gridSelectionRange && selection && !selection.isCollapsed) return;

  const range = gridSelectionRange || getNormalizedGridRange(activeGridCell, activeGridCell);
  if (!range) return;

  const text = getGridRangeClipboardText(range);
  if (!text) return;

  event.preventDefault();
  event.clipboardData?.setData("text/plain", text);
}

function getGridRangeClipboardText(range) {
  const rows = [];

  for (let rowIndex = range.startRow; rowIndex <= range.endRow; rowIndex += 1) {
    const rowValues = [];
    const row = range.rows[rowIndex];
    for (let columnIndex = range.startColumn; columnIndex <= range.endColumn; columnIndex += 1) {
      rowValues.push(getGridCellClipboardValue(row[columnIndex]));
    }
    rows.push(rowValues.join("\t"));
  }

  return rows.join("\r\n");
}

function getGridCellClipboardValue(cell) {
  if (!cell) return "";
  if (cell.querySelector(".grid-cell-checkbox")) return "x";

  return String(cell.innerText || cell.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

function parseSpreadsheetPaste(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = normalized.split("\n");
  if (rows.length > 1 && rows[rows.length - 1] === "") rows.pop();
  return rows.map((row) => row.split("\t"));
}

function isMultiCellPaste(rows) {
  return rows.length > 1 || rows.some((row) => row.length > 1);
}

function getGridEventCell(event) {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  const cell = target?.closest?.(".grid-table th, .grid-table td") || activeGridCell;

  if (!cell?.matches?.("th, td") || !cell.closest(".grid-table")) return null;
  return cell;
}

function getGridCellByOffset(table, cell, rowOffset, columnOffset) {
  const rows = getGridNavigationRows(table);
  const rowIndex = rows.findIndex((row) => row.includes(cell));
  if (rowIndex < 0) return null;

  const columnIndex = rows[rowIndex].indexOf(cell);
  let nextRowIndex = rowIndex + rowOffset;
  let nextColumnIndex = columnIndex + columnOffset;

  if (columnOffset !== 0) {
    if (nextColumnIndex >= rows[rowIndex].length) {
      nextRowIndex += 1;
      nextColumnIndex = 0;
    } else if (nextColumnIndex < 0) {
      nextRowIndex -= 1;
      nextColumnIndex = rows[nextRowIndex]?.length - 1;
    }
  }

  if (nextRowIndex < 0 || nextRowIndex >= rows.length) return null;
  nextColumnIndex = Math.min(nextColumnIndex, rows[nextRowIndex].length - 1);
  return rows[nextRowIndex][nextColumnIndex] || null;
}

function getGridNavigationRows(table) {
  return Array.from(table.rows).map((row) => Array.from(row.cells));
}

function focusGridCell(cell) {
  setActiveGridCell(cell);
  cell.focus();

  const selection = window.getSelection();
  if (!selection || !cell.isContentEditable) return;

  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertGridCellLineBreak(cell) {
  if (!cell.isContentEditable) return;

  setActiveGridCell(cell);
  cell.focus();

  const selection = window.getSelection();
  if (!selection) return;

  if (!selection.rangeCount || !cell.contains(selection.anchorNode)) {
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  if (typeof document.execCommand === "function" && document.execCommand("insertLineBreak")) {
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const lineBreak = document.createElement("br");
  range.insertNode(lineBreak);
  range.setStartAfter(lineBreak);
  range.setEndAfter(lineBreak);

  selection.removeAllRanges();
  selection.addRange(range);
}

function pasteSpreadsheetRange(table, startCell, rows) {
  const headerRow = table.querySelector("thead tr");
  const body = table.querySelector("tbody");
  if (!headerRow || !body || !rows.length) return;

  const startColumnIndex = startCell.cellIndex;
  const maxPastedColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  ensureGridColumnCount(table, startColumnIndex + maxPastedColumns);

  if (startCell.tagName.toLowerCase() === "th") {
    rows.forEach((row, rowIndex) => {
      if (rowIndex === 0) {
        row.forEach((value, columnOffset) => {
          setGridCellValue(headerRow.cells[startColumnIndex + columnOffset], value, false);
        });
        return;
      }

      const bodyRow = ensureGridBodyRow(body, rowIndex - 1);
      row.forEach((value, columnOffset) => {
        setGridCellValue(bodyRow.cells[startColumnIndex + columnOffset], value, true);
      });
    });
    return;
  }

  const startRowIndex = startCell.parentElement.sectionRowIndex;
  rows.forEach((row, rowOffset) => {
    const bodyRow = ensureGridBodyRow(body, startRowIndex + rowOffset);
    row.forEach((value, columnOffset) => {
      setGridCellValue(bodyRow.cells[startColumnIndex + columnOffset], value, true);
    });
  });
}

function ensureGridColumnCount(table, columnCount) {
  const headerRow = table.querySelector("thead tr");
  const body = table.querySelector("tbody");
  if (!headerRow || !body) return;

  while (headerRow.cells.length < columnCount) {
    const header = document.createElement("th");
    header.contentEditable = "true";
    header.textContent = `Col ${headerRow.cells.length + 1}`;
    headerRow.appendChild(header);

    Array.from(body.rows).forEach((row) => {
      const cell = row.insertCell();
      setGridCellValue(cell, "0", true);
    });
  }
}

function ensureGridBodyRow(body, rowIndex) {
  const table = body.closest("table");
  const columnCount = table?.querySelector("thead tr")?.cells.length || 1;

  while (body.rows.length <= rowIndex) {
    const row = body.insertRow();
    for (let i = 0; i < columnCount; i += 1) {
      const cell = row.insertCell();
      setGridCellValue(cell, i === 0 ? "New Item" : "0", true);
    }
  }

  return body.rows[rowIndex];
}

function setGridCellValue(cell, value, allowCheckboxConversion) {
  if (!cell) return;

  const normalizedValue = String(value ?? "");
  cell.classList.remove("checkbox-cell");
  cell.contentEditable = "true";
  cell.textContent = normalizedValue;

  if (allowCheckboxConversion && normalizedValue.trim().toLowerCase() === "x") {
    convertGridCellToCheckbox(cell);
  }
}

function convertGridCellToCheckbox(cell) {
  cell.textContent = "";
  cell.contentEditable = "false";
  cell.classList.add("checkbox-cell");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = true;
  checkbox.className = "grid-cell-checkbox";
  cell.appendChild(checkbox);
}

function setupGridCheckboxConversion(widget) {
  const table = widget.querySelector(".grid-table");
  if (!table) return;

  table.addEventListener("input", (event) => {
    const cell = event.target.closest("td");
    if (!cell || cell.querySelector(".grid-cell-checkbox")) return;

    if (cell.textContent.trim().toLowerCase() === "x") {
      convertGridCellToCheckbox(cell);
      saveActivePageNow();
    }
  });

  table.addEventListener("dblclick", (event) => {
    const cell = event.target.closest("td.checkbox-cell");
    if (!cell) return;

    cell.innerHTML = "";
    cell.classList.remove("checkbox-cell");
    cell.contentEditable = "true";
    cell.focus();
    saveActivePageNow();
  });
}

function updateGrid(widget, action) {
  const table = widget.querySelector(".grid-table");
  const headerRow = table?.querySelector("thead tr");
  const body = table?.querySelector("tbody");
  if (!table || !headerRow || !body) return;

  const rows = Array.from(body.rows);
  const columnCount = headerRow.cells.length;

  if (action === "add-row") {
    const row = body.insertRow();
    for (let i = 0; i < columnCount; i += 1) {
      const cell = row.insertCell();
      cell.contentEditable = "true";
      cell.textContent = i === 0 ? "New Item" : "0";
    }
  }

  if (action === "remove-row" && rows.length > 1) {
    rows[rows.length - 1].remove();
  }

  if (action === "add-column") {
    const header = document.createElement("th");
    header.contentEditable = "true";
    header.textContent = `Col ${columnCount + 1}`;
    headerRow.appendChild(header);

    rows.forEach((row) => {
      const cell = row.insertCell();
      cell.contentEditable = "true";
      cell.textContent = "0";
    });
  }

  if (action === "remove-column" && columnCount > 1) {
    headerRow.deleteCell(columnCount - 1);
    rows.forEach((row) => row.deleteCell(columnCount - 1));
  }

  if (activeGridCell && !table.contains(activeGridCell)) {
    activeGridCell = null;
  }
}

function initProject() {
  project = loadStoredProject();
  renderPageSelect();
  restorePage(getActivePage());
}

function loadStoredProject() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeProject(JSON.parse(stored));
  } catch (error) {
    console.warn("Stored project could not be loaded.", error);
  }
  return createDefaultProject();
}

function createDefaultProject() {
  const page = createDefaultPage("Page 1");
  return {
    version: APP_VERSION,
    name: "Karta Mockup Project",
    updatedAt: new Date().toISOString(),
    activePageId: page.id,
    pages: [page],
  };
}

function createDefaultPage(name) {
  return {
    id: createId("page"),
    name,
    updatedAt: new Date().toISOString(),
    metadata: createDefaultPageMetadata(),
    shell: {
      appName: "[App Name]",
      pagePath: name,
      categoryName: "[Category]",
      workspaceName: "[Workspace Name]",
      pageTitle: name,
      insightsTitle: "Additional Insights",
    },
    headerFilters: [],
    insightsHidden: false,
    nextCounter: 1,
    nextZ: 5,
    mainCards: [],
    insightCards: [],
  };
}

function createDefaultPageMetadata() {
  return {
    functionalArea: "",
    persona: "",
    purpose: "",
  };
}

function normalizePageShell(pageName, candidateShell) {
  const baseShell = createDefaultPage(pageName).shell;
  const parsedPath = parsePagePath(candidateShell.pagePath || "");
  let categoryName = candidateShell.categoryName || parsedPath.categoryName || baseShell.categoryName;
  const duplicatedPath = `${pageName} / ${pageName}`;
  if (categoryName === pageName && (!candidateShell.pagePath || candidateShell.pagePath === pageName || candidateShell.pagePath === duplicatedPath)) {
    categoryName = baseShell.categoryName;
  }
  const pagePath = `${categoryName} / ${pageName}`;

  return {
    ...baseShell,
    ...candidateShell,
    categoryName,
    pagePath,
  };
}

function parsePagePath(pagePath) {
  if (!pagePath || pagePath === DEFAULT_PAGE_PATH) {
    return { categoryName: "", pageName: "" };
  }

  if (!pagePath.includes("/")) {
    return { categoryName: "", pageName: pagePath.trim() };
  }

  const [categoryName] = pagePath.split("/").map((part) => part.trim());
  return {
    categoryName,
    pageName: pagePath.split("/").slice(1).join("/").trim(),
  };
}

function normalizeProject(candidate) {
  if (!candidate || !Array.isArray(candidate.pages) || candidate.pages.length === 0) {
    throw new Error("Project JSON does not contain pages.");
  }

  const pages = candidate.pages.map((page, index) => {
    const name = page.name || `Page ${index + 1}`;
    const basePage = createDefaultPage(name);
    const shell = normalizePageShell(name, page.shell || {});

    return {
      ...basePage,
      ...page,
      id: page.id || createId("page"),
      name,
      metadata: {
        ...createDefaultPageMetadata(),
        ...(page.metadata || {}),
      },
      shell,
      headerFilters: Array.isArray(page.headerFilters) ? page.headerFilters : [],
      mainCards: Array.isArray(page.mainCards) ? page.mainCards : [],
      insightCards: Array.isArray(page.insightCards) ? page.insightCards : [],
    };
  });

  const activePageId = pages.some((page) => page.id === candidate.activePageId) ? candidate.activePageId : pages[0].id;
  return {
    version: APP_VERSION,
    name: candidate.name || "Karta Mockup Project",
    updatedAt: candidate.updatedAt || new Date().toISOString(),
    activePageId,
    pages,
  };
}

function getActivePage() {
  return project.pages.find((page) => page.id === project.activePageId) || project.pages[0];
}

function switchToPage(pageId) {
  if (pageId === project.activePageId) return;
  saveActivePageNow();
  project.activePageId = pageId;
  restorePage(getActivePage());
  persistProject();
}

function saveActivePageNow() {
  if (!project || isRestoring) return;
  window.clearTimeout(saveTimer);
  const page = getActivePage();
  if (!page) return;
  Object.assign(page, captureCurrentPage());
  project.updatedAt = new Date().toISOString();
  persistProject();
  renderPageSelect();
}

function scheduleAutoSave() {
  if (isRestoring) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveActivePageNow, 250);
}

function persistProject() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

function captureCurrentPage() {
  const name = getCurrentPageName();
  return {
    name,
    updatedAt: new Date().toISOString(),
    metadata: getPageMetadata(getActivePage()),
    shell: {
      appName: shellAppName.textContent.trim() || "[App Name]",
      categoryName: shellCategoryName.textContent.trim() || "[Category]",
      pagePath: getCurrentPagePathLabel(name),
      workspaceName: workspaceName.textContent.trim() || "[Workspace Name]",
      pageTitle: pageTitle.textContent.trim() || name,
      insightsTitle: insightsTitle.textContent.trim() || "Additional Insights",
    },
    headerFilters: Array.from(contextFilterRow.querySelectorAll(".header-filter")).map((filter) => ({
      label: filter.querySelector(".filter-label")?.textContent.trim() || "Filter",
      value: "",
    })),
    insightsHidden: insights.classList.contains("hidden"),
    nextCounter: counter,
    nextZ: z,
    mainCards: serializeCards(canvas),
    insightCards: serializeCards(insightsCanvas),
  };
}

function serializeCards(container) {
  return Array.from(container.querySelectorAll(":scope > .widget")).map((widget) => {
    syncWidgetFilters(widget);
    const header = widget.querySelector(".widget-header");
    return {
      id: widget.dataset.widgetId,
      type: widget.dataset.type || "card",
      className: widget.className,
      rect: {
        x: snapToGrid(widget.offsetLeft || parseInt(widget.style.left, 10) || 0),
        y: snapToGrid(widget.offsetTop || parseInt(widget.style.top, 10) || 0),
        width: snapToGrid(widget.offsetWidth || parseInt(widget.style.width, 10) || getDefaultWidth(widget.dataset.type)),
        height: snapToGrid(widget.offsetHeight || parseInt(widget.style.height, 10) || getDefaultHeight(widget.dataset.type)),
        zIndex: Number(widget.style.zIndex) || 5,
      },
      headerHTML: header?.innerHTML || "",
      headerEditable: header?.getAttribute("contenteditable") || "",
      contentHTML: getSerializableWidgetContentHTML(widget),
      metadata: getWidgetMetadata(widget),
    };
  });
}

function getSerializableWidgetContentHTML(widget) {
  const content = widget.querySelector(".widget-content");
  if (!content) return "";

  const clone = content.cloneNode(true);
  clone.querySelectorAll(".active-grid-cell, .selected-grid-cell").forEach((cell) => {
    cell.classList.remove("active-grid-cell");
    cell.classList.remove("selected-grid-cell");
  });
  return clone.innerHTML;
}

function restorePage(page) {
  isRestoring = true;
  activeDetailsWidget = null;
  clearActiveGridCell();
  canvas.innerHTML = "";
  insightsCanvas.innerHTML = "";
  contextFilterRow.innerHTML = "";

  const shell = normalizePageShell(page.name || "Untitled Page", page.shell || {});
  page.shell = shell;

  shellAppName.textContent = shell.appName || "[App Name]";
  shellCategoryName.textContent = shell.categoryName || "[Category]";
  shellPageName.textContent = page.name || "Untitled Page";
  workspaceName.textContent = page.shell?.workspaceName || "[Workspace Name]";
  pageTitle.textContent = page.shell?.pageTitle || page.name;
  insightsTitle.textContent = page.shell?.insightsTitle || "Additional Insights";
  setInsightsHidden(Boolean(page.insightsHidden));

  (page.headerFilters || []).forEach((filter) => addHeaderFilter(filter.label || filter.value));
  restoreCards(canvas, page.mainCards || [], false);
  restoreCards(insightsCanvas, page.insightCards || [], true);

  counter = Math.max(page.nextCounter || 1, getHighestWidgetNumber() + 1);
  z = Math.max(page.nextZ || 5, getHighestZ());
  isRestoring = false;
  renderPageSelect();
  updateCanvasOverflowWarning();
}

function restoreCards(container, cards, isInsightsDestination) {
  cards.forEach((card) => {
    const widget = template.content.firstElementChild.cloneNode(true);
    widget.dataset.type = card.type || "card";
    widget.dataset.widgetId = card.id || createId("widget");
    widget.className = card.className || "widget sketch-border";

    const header = widget.querySelector(".widget-header");
    if (header && !card.headerHTML) header.remove();
    if (header && card.headerHTML) {
      header.innerHTML = card.headerHTML;
      if (card.headerEditable) header.setAttribute("contenteditable", card.headerEditable);
    }
    widget.querySelector(".widget-content").innerHTML = card.contentHTML || "";
    widget.querySelectorAll(".active-grid-cell, .selected-grid-cell").forEach((cell) => {
      cell.classList.remove("active-grid-cell");
      cell.classList.remove("selected-grid-cell");
    });
    setupWidgetMetadata(widget, card.metadata);
    container.appendChild(widget);

    if (isInsightsDestination) {
      prepareInsightsWidget(widget);
    } else if (card.rect) {
      applyRect(widget, card.rect);
      widget.style.zIndex = String(card.rect.zIndex || 5);
    }

    (card.metadata?.filters || []).forEach((filter) => addWidgetFilter(widget, filter));
    wireWidget(widget, isInsightsDestination);
  });
}

function renderPageSelect() {
  const activeId = project.activePageId;
  if (pageSelect) pageSelect.innerHTML = "";
  shellPageMenu.innerHTML = "";

  project.pages.forEach((page) => {
    if (pageSelect) {
      const option = document.createElement("option");
      option.value = page.id;
      option.textContent = page.name || "Untitled Page";
      option.selected = page.id === activeId;
      pageSelect.appendChild(option);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.role = "menuitem";
    button.dataset.pageId = page.id;
    button.className = "shell-page-menu-item";
    button.setAttribute("aria-current", String(page.id === activeId));
    button.innerHTML = `
      <span class="shell-page-menu-name"></span>
      <span class="shell-page-menu-path"></span>
    `;
    button.querySelector(".shell-page-menu-name").textContent = page.name || "Untitled Page";
    button.querySelector(".shell-page-menu-path").textContent = getPagePathLabel(page);
    shellPageMenu.appendChild(button);
  });
}

function toggleShellPageMenu() {
  const isOpen = !shellPageMenu.hidden;
  if (isOpen) {
    closeShellPageMenu();
  } else {
    shellPageMenu.hidden = false;
    shellPageMenuButton.setAttribute("aria-expanded", "true");
  }
}

function closeShellPageMenu() {
  shellPageMenu.hidden = true;
  shellPageMenuButton.setAttribute("aria-expanded", "false");
}

function syncActivePageName() {
  const page = getActivePage();
  page.name = getCurrentPageName();
  shellPageName.textContent = page.name;
  renderPageSelect();
}

function getCurrentPageName() {
  return pageTitle.textContent.trim() || shellPageName.textContent.trim() || "Untitled Page";
}

function getPagePathLabel(page) {
  const categoryName = page.shell?.categoryName?.trim() || parsePagePath(page.shell?.pagePath || "").categoryName || "[Category]";
  return `${categoryName} / ${page.name || "Untitled Page"}`;
}

function getCurrentPagePathLabel(pageName = getCurrentPageName()) {
  const categoryName = shellCategoryName.textContent.trim() || "[Category]";
  return `${categoryName} / ${pageName || "Untitled Page"}`;
}

function getUniquePageName(baseName) {
  const names = new Set(project.pages.map((page) => page.name));
  if (!names.has(baseName)) return baseName;
  let i = 2;
  while (names.has(`${baseName} ${i}`)) i += 1;
  return `${baseName} ${i}`;
}

function setInsightsHidden(hidden) {
  insights.classList.toggle("hidden", hidden);
  pageBody.classList.toggle("insights-hidden", hidden);
  toggleInsights.setAttribute("aria-pressed", String(!hidden));
  toggleInsights.setAttribute("aria-label", hidden ? "Expand Additional Insights" : "Collapse Additional Insights");
  toggleInsights.setAttribute("title", hidden ? "Expand Additional Insights" : "Collapse Additional Insights");
  updateCanvasOverflowWarning();
}

function syncTargetAreaChoices() {
  targetAreaChoices.forEach((choice) => {
    choice.checked = choice.value === targetArea.value;
  });
}

function updateCanvasOverflowWarning() {
  if (!canvasOverflowWarning || !uxPage) return;
  const visibleBottom = uxPage.clientHeight;
  const hasOverflowCards = Array.from(canvas.querySelectorAll(":scope > .widget")).some((widget) => {
    return widget.offsetTop + widget.offsetHeight > visibleBottom + 1;
  });
  canvasOverflowWarning.hidden = !hasOverflowCards;
}

function findOpenPosition(container, widget, width, height) {
  const maxX = container.clientWidth - width - CANVAS_GAP;
  const maxY = getPlacementHeight(container) - height - CANVAS_GAP;

  for (let y = CANVAS_GAP; y <= maxY; y += GRID_SIZE) {
    for (let x = CANVAS_GAP; x <= maxX; x += GRID_SIZE) {
      const rect = { x, y, width, height };
      if (isRectValid(container, rect, widget)) {
        return rect;
      }
    }
  }

  return null;
}

function isRectValid(container, rect, currentWidget) {
  if (rect.x < CANVAS_GAP || rect.y < CANVAS_GAP) return false;
  if (rect.x + rect.width > container.clientWidth - CANVAS_GAP) return false;
  if (rect.y + rect.height > getPlacementHeight(container) - CANVAS_GAP) return false;

  return Array.from(container.querySelectorAll(".widget")).every((widget) => {
    if (widget === currentWidget) return true;
    return !rectsOverlapWithGap(rect, getElementRect(widget), CANVAS_GAP);
  });
}

function getPlacementHeight(container) {
  if (container === canvas) return Math.max(container.scrollHeight, container.clientHeight, EXPANDED_CANVAS_HEIGHT);
  return container.clientHeight;
}

function rectsOverlapWithGap(a, b, gap) {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function getElementRect(el) {
  return {
    x: snapToGrid(el.offsetLeft),
    y: snapToGrid(el.offsetTop),
    width: snapToGrid(el.offsetWidth),
    height: snapToGrid(el.offsetHeight),
  };
}

function applyRect(el, rect) {
  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function snapToGrid(value, size = GRID_SIZE) {
  return Math.max(size, Math.round(value / size) * size);
}

function getHighestWidgetNumber() {
  return Math.max(
    0,
    ...Array.from(document.querySelectorAll(".widget[data-widget-id]")).map((widget) => {
      const match = widget.dataset.widgetId.match(/(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
  );
}

function getHighestZ() {
  return Math.max(
    5,
    ...Array.from(document.querySelectorAll(".widget")).map((widget) => Number(widget.style.zIndex) || 5)
  );
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "mockup-project";
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
