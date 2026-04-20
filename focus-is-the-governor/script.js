const state = {
  mode: "human",
  shared: {
    focus: 82,
    workstreams: 3,
    decoupling: 76,
    baseSerial: 8,
  },
  human: {
    contributors: 12,
  },
  agent: {
    contributors: 48,
    owners: 4,
    reviewCapacity: 8,
  },
  showFocusedPath: true,
};

const palette = {
  base: "#4b5d73",
  focus: "#d45f3a",
  workstreams: "#d9a33d",
  coupling: "#1b857c",
  coordination: "#2c6ea6",
  judgment: "#8f4a33",
};

const presets = {
  "v1-team": {
    mode: "human",
    shared: {
      focus: 90,
      workstreams: 2,
      decoupling: 84,
      baseSerial: 5,
    },
    human: {
      contributors: 12,
    },
  },
  "post-launch": {
    mode: "human",
    shared: {
      focus: 44,
      workstreams: 8,
      decoupling: 46,
      baseSerial: 18,
    },
    human: {
      contributors: 60,
    },
  },
  "agent-gold-rush": {
    mode: "agent",
    shared: {
      focus: 34,
      workstreams: 12,
      decoupling: 38,
      baseSerial: 12,
    },
    agent: {
      contributors: 120,
      owners: 2,
      reviewCapacity: 5,
    },
  },
  "focused-pod": {
    mode: "agent",
    shared: {
      focus: 85,
      workstreams: 3,
      decoupling: 78,
      baseSerial: 8,
    },
    agent: {
      contributors: 48,
      owners: 4,
      reviewCapacity: 8,
    },
  },
};

const refs = {
  contributors: document.querySelector("#contributors"),
  focus: document.querySelector("#focus"),
  workstreams: document.querySelector("#workstreams"),
  decoupling: document.querySelector("#decoupling"),
  baseSerial: document.querySelector("#baseSerial"),
  owners: document.querySelector("#owners"),
  reviewCapacity: document.querySelector("#reviewCapacity"),
  contributorsLabel: document.querySelector("#contributorsLabel"),
  contributorsValue: document.querySelector("#contributorsValue"),
  contributorsHelp: document.querySelector("#contributorsHelp"),
  focusValue: document.querySelector("#focusValue"),
  workstreamsValue: document.querySelector("#workstreamsValue"),
  decouplingValue: document.querySelector("#decouplingValue"),
  baseSerialValue: document.querySelector("#baseSerialValue"),
  ownersValue: document.querySelector("#ownersValue"),
  reviewCapacityValue: document.querySelector("#reviewCapacityValue"),
  showFocusedPath: document.querySelector("#showFocusedPath"),
  agentFields: document.querySelector("#agentFields"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  presetButtons: Array.from(document.querySelectorAll(".preset-card")),
  velocityMetric: document.querySelector("#velocityMetric"),
  serialMetric: document.querySelector("#serialMetric"),
  serialCopy: document.querySelector("#serialCopy"),
  efficiencyMetric: document.querySelector("#efficiencyMetric"),
  peakMetric: document.querySelector("#peakMetric"),
  peakCopy: document.querySelector("#peakCopy"),
  pressureLabel: document.querySelector("#pressureLabel"),
  pressureMetric: document.querySelector("#pressureMetric"),
  pressureCopy: document.querySelector("#pressureCopy"),
  curveSummary: document.querySelector("#curveSummary"),
  serialBar: document.querySelector("#serialBar"),
  serialLegend: document.querySelector("#serialLegend"),
  diagnosisTitle: document.querySelector("#diagnosisTitle"),
  diagnosisCopy: document.querySelector("#diagnosisCopy"),
  chart: document.querySelector("#velocityChart"),
  focusedLegend: document.querySelector("#focusedLegend"),
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPercent(value, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

function formatFactor(value, digits = 2) {
  return `${value.toFixed(digits)}x`;
}

function formatCount(value) {
  return new Intl.NumberFormat().format(Math.round(value));
}

function contributorLimit(mode) {
  return mode === "human" ? 120 : 240;
}

function contributorLabel(mode) {
  return mode === "human" ? "Team size" : "Agent count";
}

function contributorHelp(mode) {
  return mode === "human"
    ? "How many people are executing this scope at the same time."
    : "How many agents are producing output in parallel.";
}

function modeUnit(mode, count = 2) {
  if (mode === "human") {
    return count === 1 ? "person" : "people";
  }

  return count === 1 ? "agent" : "agents";
}

function focusedVariant(currentState) {
  return {
    mode: currentState.mode,
    showFocusedPath: currentState.showFocusedPath,
    human: { ...currentState.human },
    agent: { ...currentState.agent },
    shared: {
      focus: clamp(currentState.shared.focus + 18, 0, 100),
      workstreams: clamp(currentState.shared.workstreams - 2, 1, 12),
      decoupling: clamp(currentState.shared.decoupling + 14, 0, 100),
      baseSerial: currentState.shared.baseSerial,
    },
  };
}

function scaleComponentsToCap(components, serial) {
  const total = components.reduce((sum, component) => sum + component.value, 0);

  if (total <= 0 || total <= serial) {
    return components;
  }

  const ratio = serial / total;
  return components.map((component) => ({
    ...component,
    value: component.value * ratio,
  }));
}

function buildHumanSnapshot(contributors, shared) {
  const focusLoss = 1 - shared.focus / 100;
  const decoupleLoss = 1 - shared.decoupling / 100;
  const streamPressure = (shared.workstreams - 1) / 11;
  const base = shared.baseSerial / 100;
  const focusTax = 0.22 * focusLoss;
  const streamTax = 0.18 * streamPressure;
  const couplingTax = 0.14 * decoupleLoss * (0.45 + 0.55 * streamPressure);
  const coordinationTax =
    0.34 * ((contributors - 1) / 119) ** 2 * (0.35 + 0.65 * decoupleLoss);
  const serial = clamp(
    base + focusTax + streamTax + couplingTax + coordinationTax,
    0.02,
    0.92
  );
  const speedup = 1 / (serial + (1 - serial) / contributors);
  const components = scaleComponentsToCap([
    {
      key: "base",
      label: "Base serial work",
      color: palette.base,
      value: base,
      recommendation: "Some serial work is real, so the leverage is elsewhere.",
    },
    {
      key: "focus",
      label: "Priority sprawl",
      color: palette.focus,
      value: focusTax,
      recommendation: "Cut parallel bets before adding more people.",
    },
    {
      key: "workstreams",
      label: "Too many live workstreams",
      color: palette.workstreams,
      value: streamTax,
      recommendation: "Sequence workstreams instead of running everything at once.",
    },
    {
      key: "coupling",
      label: "Cross-team coupling",
      color: palette.coupling,
      value: couplingTax,
      recommendation: "Clarify interfaces so teams can execute without permission.",
    },
    {
      key: "coordination",
      label: "Coordination drag",
      color: palette.coordination,
      value: coordinationTax,
      recommendation: "Split the team into smaller pods before adding headcount.",
    },
  ], serial);
  const bottleneck = [...components]
    .filter((component) => component.key !== "base")
    .sort((left, right) => right.value - left.value)[0];

  return {
    contributors,
    serial,
    speedup,
    efficiency: speedup / contributors,
    components,
    bottleneck,
    fixedCeiling: 1 / serial,
    meta: {
      syncEdges: (contributors * (contributors - 1)) / 2,
    },
  };
}

function buildAgentSnapshot(contributors, shared, agent) {
  const focusLoss = 1 - shared.focus / 100;
  const decoupleLoss = 1 - shared.decoupling / 100;
  const streamPressure = (shared.workstreams - 1) / 11;
  const base = shared.baseSerial / 100;
  const ownerSpan = shared.workstreams / Math.max(agent.owners, 1);
  const reviewLoad =
    contributors / Math.max(agent.owners * agent.reviewCapacity, 1);
  const reviewOverload = Math.max(0, reviewLoad - 1);
  const focusTax = 0.18 * focusLoss;
  const streamTax = 0.12 * streamPressure;
  const architectureTax =
    0.12 * decoupleLoss +
    0.08 * decoupleLoss * streamPressure +
    0.04 * ((contributors - 1) / 239) ** 2 * (0.4 + 0.6 * decoupleLoss);
  const judgmentTax =
    0.3 * (1 - Math.exp(-reviewOverload / 1.8)) +
    0.1 * Math.min(Math.max(ownerSpan - 1, 0) / 4, 1);
  const serial = clamp(
    base + focusTax + streamTax + architectureTax + judgmentTax,
    0.02,
    0.92
  );
  const speedup = 1 / (serial + (1 - serial) / contributors);
  const components = scaleComponentsToCap([
    {
      key: "base",
      label: "Base serial work",
      color: palette.base,
      value: base,
      recommendation: "Some serial work stays serial no matter how fast execution gets.",
    },
    {
      key: "focus",
      label: "Priority sprawl",
      color: palette.focus,
      value: focusTax,
      recommendation: "Cheap execution is not a license to run every idea at once.",
    },
    {
      key: "workstreams",
      label: "Too many live workstreams",
      color: palette.workstreams,
      value: streamTax,
      recommendation: "Reduce concurrent bets so ownership can stay coherent.",
    },
    {
      key: "architecture",
      label: "Architecture drag",
      color: palette.coupling,
      value: architectureTax,
      recommendation: "Invest in cleaner interfaces and more legible code paths.",
    },
    {
      key: "judgment",
      label: "Human judgment bottleneck",
      color: palette.judgment,
      value: judgmentTax,
      recommendation: "Add owners or slow the firehose until review can keep up.",
    },
  ], serial);
  const bottleneck = [...components]
    .filter((component) => component.key !== "base")
    .sort((left, right) => right.value - left.value)[0];

  return {
    contributors,
    serial,
    speedup,
    efficiency: speedup / contributors,
    components,
    bottleneck,
    fixedCeiling: 1 / serial,
    meta: {
      reviewLoad,
      ownerSpan,
    },
  };
}

function buildSnapshot(mode, contributors, fullState) {
  if (mode === "human") {
    return buildHumanSnapshot(contributors, fullState.shared);
  }

  return buildAgentSnapshot(contributors, fullState.shared, fullState.agent);
}

function buildSeries(mode, fullState) {
  const limit = contributorLimit(mode);
  const values = [];

  for (let contributors = 1; contributors <= limit; contributors += 1) {
    values.push(buildSnapshot(mode, contributors, fullState));
  }

  return values;
}

function peakSnapshot(series) {
  return series.reduce((best, point) =>
    point.speedup > best.speedup ? point : best
  );
}

function syncInputsToState() {
  const modeState = state[state.mode];
  refs.contributors.max = String(contributorLimit(state.mode));
  refs.contributors.value = String(modeState.contributors);
  refs.focus.value = String(state.shared.focus);
  refs.workstreams.value = String(state.shared.workstreams);
  refs.decoupling.value = String(state.shared.decoupling);
  refs.baseSerial.value = String(state.shared.baseSerial);
  refs.owners.value = String(state.agent.owners);
  refs.reviewCapacity.value = String(state.agent.reviewCapacity);
  refs.showFocusedPath.checked = state.showFocusedPath;
  refs.agentFields.classList.toggle("is-hidden", state.mode !== "agent");
  refs.contributorsLabel.textContent = contributorLabel(state.mode);
  refs.contributorsHelp.textContent = contributorHelp(state.mode);

  refs.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });

  refs.contributorsValue.textContent = formatCount(modeState.contributors);
  refs.focusValue.textContent = formatPercent(state.shared.focus, 0);
  refs.workstreamsValue.textContent = formatCount(state.shared.workstreams);
  refs.decouplingValue.textContent = formatPercent(state.shared.decoupling, 0);
  refs.baseSerialValue.textContent = formatPercent(state.shared.baseSerial, 0);
  refs.ownersValue.textContent = formatCount(state.agent.owners);
  refs.reviewCapacityValue.textContent = formatCount(state.agent.reviewCapacity);
}

function renderMetrics(current, peak) {
  refs.velocityMetric.textContent = formatFactor(current.speedup);
  refs.serialMetric.textContent = formatPercent(current.serial * 100);
  refs.serialCopy.textContent =
    `If S froze here, the ceiling would be ${formatFactor(current.fixedCeiling, 1)}.`;
  refs.efficiencyMetric.textContent = formatPercent(current.efficiency * 100);
  refs.peakMetric.textContent = `${formatCount(peak.contributors)} ${modeUnit(
    state.mode,
    peak.contributors
  )}`;
  refs.peakCopy.textContent = `Peak velocity is ${formatFactor(peak.speedup)} on this curve.`;

  if (state.mode === "human") {
    refs.pressureLabel.textContent = "Potential sync edges";
    refs.pressureMetric.textContent = formatCount(current.meta.syncEdges);
    refs.pressureCopy.textContent =
      "Pairwise alignment paths if everybody has to coordinate.";
  } else {
    refs.pressureLabel.textContent = "Review load";
    refs.pressureMetric.textContent = formatPercent(current.meta.reviewLoad * 100, 0);
    refs.pressureCopy.textContent =
      "Agent output pressure versus declared human review capacity.";
  }
}

function renderBreakdown(snapshot) {
  refs.serialBar.innerHTML = "";
  refs.serialLegend.innerHTML = "";
  const total = snapshot.components.reduce(
    (sum, component) => sum + component.value,
    0
  ) || 1;

  snapshot.components.forEach((component) => {
    const segment = document.createElement("div");
    segment.className = "serial-segment";
    segment.style.width = `${(component.value / total) * 100}%`;
    segment.style.background = component.color;
    refs.serialBar.appendChild(segment);

    const item = document.createElement("article");
    item.className = "legend-item";
    item.innerHTML = `
      <strong>
        <span class="legend-dot" style="background:${component.color}"></span>
        ${component.label}
      </strong>
      <span class="legend-value">${formatPercent(component.value * 100)}</span>
      <span class="control-help">${component.recommendation}</span>
    `;
    refs.serialLegend.appendChild(item);
  });
}

function renderDiagnosis(current, peak, focusedPeak) {
  const delta = focusedPeak ? focusedPeak.speedup - peak.speedup : 0;
  let title = "Focus still buys you headroom";

  if (current.contributors > peak.contributors) {
    title = "You are already past the efficient size for this setup";
  } else if (current.contributors >= peak.contributors * 0.85) {
    title = "You are close to saturation";
  }

  refs.diagnosisTitle.textContent = title;

  const firstSentence =
    `The largest source of drag is ${current.bottleneck.label.toLowerCase()}, contributing ${formatPercent(
      current.bottleneck.value * 100
    )} to the serial fraction. ${current.bottleneck.recommendation}`;

  const secondSentence =
    state.mode === "human"
      ? `At ${formatCount(current.contributors)} ${modeUnit(
          state.mode,
          current.contributors
        )}, the coordination graph has ${formatCount(
          current.meta.syncEdges
        )} possible pairings.`
      : `Your owners are covering ${current.meta.ownerSpan.toFixed(
          1
        )} workstreams each on average, and review demand is at ${formatPercent(
          current.meta.reviewLoad * 100,
          0
        )} of capacity.`;

  const thirdSentence =
    focusedPeak && delta > 0.05
      ? `A tighter-focus version of the same setup moves the peak from ${formatCount(
          peak.contributors
        )} to ${formatCount(focusedPeak.contributors)} ${modeUnit(
          state.mode,
          focusedPeak.contributors
        )} and raises peak velocity by ${formatFactor(delta)}.`
      : "Tightening focus helps most when it removes actual serial work rather than just hiding it.";

  refs.diagnosisCopy.textContent = `${firstSentence} ${secondSentence} ${thirdSentence}`;
}

function renderCurveSummary(current, peak, focusedPeak) {
  const headroom = peak.contributors - current.contributors;
  const zoneText =
    current.contributors > peak.contributors
      ? `You are in negative scaling territory because the curve already peaked at ${formatCount(
          peak.contributors
        )} ${modeUnit(state.mode, peak.contributors)}.`
      : `This setup tops out at ${formatCount(peak.contributors)} ${modeUnit(
          state.mode,
          peak.contributors
        )}, leaving about ${formatCount(Math.max(headroom, 0))} more before the peak.`;

  const focusedText =
    focusedPeak && state.showFocusedPath
      ? ` The tighter-focus path reaches ${formatFactor(
          focusedPeak.speedup
        )} and peaks at ${formatCount(focusedPeak.contributors)} ${modeUnit(
          state.mode,
          focusedPeak.contributors
        )}.`
      : "";

  refs.curveSummary.textContent = `${zoneText}${focusedText}`;
}

function drawSeriesPath(context, series, xScale, yScale, stroke, fill, options = {}) {
  context.save();
  context.beginPath();
  series.forEach((point, index) => {
    const x = xScale(point.contributors);
    const y = yScale(point.speedup);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  if (fill) {
    const lastX = xScale(series[series.length - 1].contributors);
    const firstX = xScale(series[0].contributors);
    const bottom = yScale(0);
    context.lineTo(lastX, bottom);
    context.lineTo(firstX, bottom);
    context.closePath();
    context.fillStyle = fill;
    context.fill();

    context.beginPath();
    series.forEach((point, index) => {
      const x = xScale(point.contributors);
      const y = yScale(point.speedup);

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
  }

  if (options.dashed) {
    context.setLineDash([8, 8]);
  }

  context.strokeStyle = stroke;
  context.lineWidth = options.lineWidth || 3;
  context.stroke();
  context.restore();
}

function drawChart(series, current, peak, focusedSeries, focusedPeak) {
  const canvas = refs.chart;
  const context = canvas.getContext("2d");
  const devicePixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * devicePixelRatio);
  canvas.height = Math.floor(height * devicePixelRatio);
  context.scale(devicePixelRatio, devicePixelRatio);
  context.clearRect(0, 0, width, height);

  const padding = { top: 24, right: 22, bottom: 36, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxContributors = contributorLimit(state.mode);
  const maxSpeedup = Math.max(
    peak.speedup,
    focusedPeak ? focusedPeak.speedup : 0,
    1.2
  );

  const xScale = (value) =>
    padding.left + ((value - 1) / (maxContributors - 1)) * chartWidth;
  const yScale = (value) =>
    padding.top + chartHeight - (value / (maxSpeedup * 1.08)) * chartHeight;

  context.strokeStyle = "rgba(31, 36, 48, 0.12)";
  context.fillStyle = "rgba(94, 102, 114, 0.9)";
  context.font = '12px Aptos, "Segoe UI", sans-serif';

  for (let step = 0; step <= 4; step += 1) {
    const value = (maxSpeedup * step) / 4;
    const y = yScale(value);
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(value.toFixed(1), 18, y + 4);
  }

  [1, Math.round(maxContributors / 2), maxContributors].forEach((value) => {
    const x = xScale(value);
    context.fillText(String(value), x - 8, height - 10);
  });

  const negativeStartX = xScale(peak.contributors);
  context.fillStyle = "rgba(180, 61, 49, 0.08)";
  context.fillRect(
    negativeStartX,
    padding.top,
    width - padding.right - negativeStartX,
    chartHeight
  );

  const fillGradient = context.createLinearGradient(0, padding.top, 0, height);
  fillGradient.addColorStop(0, "rgba(212, 95, 58, 0.18)");
  fillGradient.addColorStop(1, "rgba(212, 95, 58, 0.01)");
  drawSeriesPath(context, series, xScale, yScale, palette.focus, fillGradient);

  if (state.showFocusedPath && focusedSeries) {
    drawSeriesPath(context, focusedSeries, xScale, yScale, palette.coupling, null, {
      dashed: true,
      lineWidth: 2.5,
    });
  }

  context.save();
  context.setLineDash([4, 6]);
  context.strokeStyle = "rgba(31, 36, 48, 0.3)";
  context.beginPath();
  context.moveTo(xScale(peak.contributors), padding.top);
  context.lineTo(xScale(peak.contributors), height - padding.bottom);
  context.stroke();
  context.restore();

  const currentX = xScale(current.contributors);
  const currentY = yScale(current.speedup);
  context.fillStyle = palette.focus;
  context.beginPath();
  context.arc(currentX, currentY, 5.5, 0, Math.PI * 2);
  context.fill();

  const peakX = xScale(peak.contributors);
  const peakY = yScale(peak.speedup);
  context.fillStyle = "#fff";
  context.strokeStyle = palette.focus;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(peakX, peakY, 6.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(31, 36, 48, 0.9)";
  context.fillText(`peak ${peak.contributors}`, peakX + 8, peakY - 10);

  if (state.showFocusedPath && focusedPeak) {
    const focusedX = xScale(focusedPeak.contributors);
    const focusedY = yScale(focusedPeak.speedup);
    context.fillStyle = palette.coupling;
    context.beginPath();
    context.arc(focusedX, focusedY, 5.5, 0, Math.PI * 2);
    context.fill();
    context.fillText(`focused ${focusedPeak.contributors}`, focusedX + 8, focusedY + 18);
  }
}

function render() {
  syncInputsToState();
  refs.focusedLegend.classList.toggle("is-hidden", !state.showFocusedPath);

  const currentContributors = state[state.mode].contributors;
  const current = buildSnapshot(state.mode, currentContributors, state);
  const series = buildSeries(state.mode, state);
  const peak = peakSnapshot(series);

  let focusedSeries = null;
  let focusedPeak = null;

  if (state.showFocusedPath) {
    const focusedState = focusedVariant(state);
    focusedSeries = buildSeries(state.mode, focusedState);
    focusedPeak = peakSnapshot(focusedSeries);
  }

  renderMetrics(current, peak);
  renderBreakdown(current);
  renderDiagnosis(current, peak, focusedPeak);
  renderCurveSummary(current, peak, focusedPeak);
  drawChart(series, current, peak, focusedSeries, focusedPeak);
}

function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  state.mode = preset.mode;
  state.shared = { ...state.shared, ...preset.shared };
  state.human = { ...state.human, ...preset.human };
  state.agent = { ...state.agent, ...preset.agent };
  render();
}

refs.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    render();
  });
});

refs.presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyPreset(button.dataset.preset);
  });
});

refs.contributors.addEventListener("input", (event) => {
  state[state.mode].contributors = Number(event.target.value);
  render();
});

refs.focus.addEventListener("input", (event) => {
  state.shared.focus = Number(event.target.value);
  render();
});

refs.workstreams.addEventListener("input", (event) => {
  state.shared.workstreams = Number(event.target.value);
  render();
});

refs.decoupling.addEventListener("input", (event) => {
  state.shared.decoupling = Number(event.target.value);
  render();
});

refs.baseSerial.addEventListener("input", (event) => {
  state.shared.baseSerial = Number(event.target.value);
  render();
});

refs.owners.addEventListener("input", (event) => {
  state.agent.owners = Number(event.target.value);
  render();
});

refs.reviewCapacity.addEventListener("input", (event) => {
  state.agent.reviewCapacity = Number(event.target.value);
  render();
});

refs.showFocusedPath.addEventListener("change", (event) => {
  state.showFocusedPath = event.target.checked;
  render();
});

window.addEventListener("resize", render);

render();
