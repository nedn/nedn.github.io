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

const milestoneBlueprint = [
  {
    key: "foundation",
    label: "Foundation",
    shortLabel: "Foundation",
    featureCount: 4,
    stageScope: 12,
    scopeFactor: 0.95,
    integrationWeight: 0.4,
    parallelWeight: 0.3,
    coordinationWeight: 0.2,
  },
  {
    key: "core",
    label: "Core workflows",
    shortLabel: "Core",
    featureCount: 8,
    stageScope: 16,
    scopeFactor: 1,
    integrationWeight: 0.65,
    parallelWeight: 0.45,
    coordinationWeight: 0.35,
  },
  {
    key: "candidate",
    label: "Launch candidate",
    shortLabel: "Candidate",
    featureCount: 12,
    stageScope: 22,
    scopeFactor: 1.08,
    integrationWeight: 0.95,
    parallelWeight: 0.55,
    coordinationWeight: 0.5,
  },
  {
    key: "launch",
    label: "Public launch",
    shortLabel: "Launch",
    featureCount: 16,
    stageScope: 28,
    scopeFactor: 1.18,
    integrationWeight: 1.25,
    parallelWeight: 0.7,
    coordinationWeight: 0.65,
  },
];

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
  milestoneGrid: document.querySelector("#milestoneGrid"),
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

function formatCount(value) {
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatDurationWeeks(value) {
  if (Math.abs(value) < 0.05) {
    return "0 wks";
  }

  const digits = value < 10 ? 1 : 0;
  const rounded = value.toFixed(digits);
  return `${rounded} wk${Number(rounded) === 1 ? "" : "s"}`;
}

function formatDate(value) {
  const today = todayAnchor();
  const includeYear = value.getFullYear() !== today.getFullYear();
  return new Intl.DateTimeFormat(undefined, includeYear
    ? { month: "short", day: "numeric", year: "numeric" }
    : { month: "short", day: "numeric" }).format(value);
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

function todayAnchor() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildMilestoneTimeline(snapshot, fullState) {
  const startDate = todayAnchor();
  let cumulativeWeeks = 0;

  const milestones = milestoneBlueprint.map((stage, index) => {
    const throughputWeeks =
      (stage.stageScope * stage.scopeFactor) / Math.max(snapshot.speedup, 0.75);
    const serialDelay = snapshot.serial * stage.integrationWeight * 4.2;
    const workstreamDelay =
      ((fullState.shared.workstreams - 1) / 11) * stage.parallelWeight * 1.5;
    const coordinationDelay =
      fullState.mode === "human"
        ? Math.min(snapshot.meta.syncEdges / 720, 1.4) * stage.coordinationWeight
        : (
            Math.max(snapshot.meta.reviewLoad - 1, 0) * 2.1 +
            Math.max(snapshot.meta.ownerSpan - 1, 0) * 0.45
          ) * stage.coordinationWeight;
    const finishTax = index * snapshot.serial * 0.9;
    const stageWeeks = Math.max(
      1,
      throughputWeeks + serialDelay + workstreamDelay + coordinationDelay + finishTax
    );

    cumulativeWeeks += stageWeeks;

    return {
      ...stage,
      stageWeeks,
      cumulativeWeeks,
      date: addDays(startDate, cumulativeWeeks * 7),
    };
  });

  const publicLaunch = milestones[milestones.length - 1];
  const launchCandidate = milestones[milestones.length - 2];

  return {
    startDate,
    milestones,
    publicLaunch,
    launchCandidate,
    averageCadence: publicLaunch.cumulativeWeeks / milestones.length,
  };
}

function executionLoadSummary(snapshot) {
  const componentKey = state.mode === "human" ? "coordination" : "judgment";
  const component = snapshot.components.find((item) => item.key === componentKey);
  const value = component ? component.value : 0;

  if (state.mode === "human") {
    return {
      label: "Coordination load",
      value,
      copy:
        "Share of total project execution absorbed by alignment, handoffs, and keeping the team in sync.",
    };
  }

  return {
    label: "Ownership load",
    value,
    copy:
      "Share of total project execution absorbed by human ownership, review, and reconciliation loops.",
  };
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

function renderMilestoneCards(snapshot, timeline, focusedSnapshot, focusedTimeline) {
  refs.milestoneGrid.innerHTML = "";

  timeline.milestones.forEach((milestone, index) => {
    const focusedMilestone = focusedTimeline ? focusedTimeline.milestones[index] : null;
    const deltaWeeks = focusedMilestone
      ? milestone.cumulativeWeeks - focusedMilestone.cumulativeWeeks
      : 0;
    const deltaCopy =
      focusedMilestone && deltaWeeks > 0.25
        ? ` Focused path is ${formatDurationWeeks(deltaWeeks)} sooner.`
        : "";
    const card = document.createElement("article");
    card.className = `metric-card milestone-card${
      milestone.key === "launch" ? " is-highlight" : ""
    }`;
    card.innerHTML = `
      <p class="metric-label">${milestone.label}</p>
      <p class="metric-value">${formatDate(milestone.date)}</p>
      <p class="metric-copy">
        ${milestone.featureCount} features live in about ${formatDurationWeeks(
      milestone.cumulativeWeeks
    )}.${deltaCopy}
      </p>
    `;
    refs.milestoneGrid.appendChild(card);
  });

  const loadSummary = executionLoadSummary(snapshot);
  const focusedLoadSummary = focusedSnapshot
    ? executionLoadSummary(focusedSnapshot)
    : null;
  const loadDelta = focusedLoadSummary
    ? loadSummary.value - focusedLoadSummary.value
    : 0;
  const loadCard = document.createElement("article");
  loadCard.className = "metric-card milestone-card is-load-card";
  loadCard.innerHTML = `
    <p class="metric-label">${loadSummary.label}</p>
    <p class="metric-value">${formatPercent(loadSummary.value * 100)}</p>
    <p class="metric-copy">
      ${loadSummary.copy}${
        focusedLoadSummary && loadDelta > 0.002
          ? ` Focused path lowers it by ${formatPercent(loadDelta * 100)}.`
          : ""
      }
    </p>
  `;
  refs.milestoneGrid.appendChild(loadCard);

  const summaryCard = document.createElement("article");
  const focusDividend = focusedTimeline
    ? timeline.publicLaunch.cumulativeWeeks - focusedTimeline.publicLaunch.cumulativeWeeks
    : 0;

  summaryCard.className = "metric-card milestone-card";

  if (focusedTimeline) {
    const value = Math.abs(focusDividend) > 0.25
      ? formatDurationWeeks(Math.abs(focusDividend))
      : "Same window";
    const direction =
      focusDividend > 0.25
        ? `Public launch moves from ${formatDate(
            timeline.publicLaunch.date
          )} to ${formatDate(focusedTimeline.publicLaunch.date)}.`
        : focusDividend < -0.25
          ? `The focused alternative actually slips launch to ${formatDate(
              focusedTimeline.publicLaunch.date
            )}.`
          : "The focused alternative mostly smooths execution instead of changing the date.";
    summaryCard.innerHTML = `
      <p class="metric-label">Focus dividend</p>
      <p class="metric-value">${value}</p>
      <p class="metric-copy">${direction}</p>
    `;
  } else {
    summaryCard.innerHTML = `
      <p class="metric-label">Milestone cadence</p>
      <p class="metric-value">${formatDurationWeeks(timeline.averageCadence)}</p>
      <p class="metric-copy">Average elapsed time between major feature milestones.</p>
    `;
  }

  refs.milestoneGrid.appendChild(summaryCard);
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

function renderDiagnosis(current, peak, timeline, focusedTimeline) {
  const launch = timeline.publicLaunch;
  const candidate = timeline.launchCandidate;
  let title = "Launch timing still has room to compress";

  if (current.contributors > peak.contributors) {
    title = "More parallelism is now stretching the launch";
  } else if (launch.cumulativeWeeks > 34) {
    title = "The later milestones are absorbing most of the slip";
  } else if (launch.cumulativeWeeks < 20) {
    title = "This plan still fits in one focused arc";
  }

  refs.diagnosisTitle.textContent = title;

  const firstSentence =
    `The biggest delay driver is ${current.bottleneck.label.toLowerCase()}, contributing ${formatPercent(
      current.bottleneck.value * 100
    )} to the serial fraction. ${current.bottleneck.recommendation}`;

  const secondSentence =
    state.mode === "human"
      ? `At ${formatCount(current.contributors)} ${modeUnit(
          state.mode,
          current.contributors
        )}, ${candidate.label.toLowerCase()} lands around ${formatDate(
          candidate.date
        )}, and public launch lands around ${formatDate(launch.date)} after about ${formatDurationWeeks(
          launch.cumulativeWeeks
        )}.`
      : `At ${formatCount(current.contributors)} ${modeUnit(
          state.mode,
          current.contributors
        )}, owners are covering ${current.meta.ownerSpan.toFixed(
          1
        )} workstreams each and review demand is at ${formatPercent(
          current.meta.reviewLoad * 100,
          0
        )}, putting ${candidate.label.toLowerCase()} around ${formatDate(
          candidate.date
        )} and public launch around ${formatDate(launch.date)}.`;

  let thirdSentence =
    "The fastest way to pull the date in is to remove serial work between milestones, not simply add more parallel capacity.";

  if (current.contributors > peak.contributors) {
    thirdSentence = `This setup is already beyond its efficient size of ${formatCount(
      peak.contributors
    )} ${modeUnit(
      state.mode,
      peak.contributors
    )}, so extra contributors are mostly pushing integration work into later milestones.`;
  } else if (focusedTimeline) {
    const launchDelta =
      launch.cumulativeWeeks - focusedTimeline.publicLaunch.cumulativeWeeks;

    thirdSentence =
      launchDelta > 0.25
        ? `A tighter-focus version pulls public launch forward by ${formatDurationWeeks(
            launchDelta
          )} and shortens the gap between launch candidate and launch.`
        : "A tighter-focus version changes the quality of the ramp more than the date itself.";
  }

  refs.diagnosisCopy.textContent = `${firstSentence} ${secondSentence} ${thirdSentence}`;
}

function renderLaunchSummary(current, peak, timeline, focusedTimeline) {
  const candidate = timeline.launchCandidate;
  const launch = timeline.publicLaunch;
  const saturationText =
    current.contributors > peak.contributors
      ? ` You are already beyond the curve's efficient size of ${formatCount(
          peak.contributors
        )} ${modeUnit(state.mode, peak.contributors)}, so later milestones are slipping.`
      : ` The current curve still peaks near ${formatCount(peak.contributors)} ${modeUnit(
          state.mode,
          peak.contributors
        )}.`;

  let focusedText = "";

  if (focusedTimeline && state.showFocusedPath) {
    const launchDelta =
      launch.cumulativeWeeks - focusedTimeline.publicLaunch.cumulativeWeeks;
    focusedText =
      Math.abs(launchDelta) > 0.25
        ? launchDelta > 0
          ? ` The tighter-focus alternative brings public launch forward by ${formatDurationWeeks(
              launchDelta
            )}.`
          : ` The tighter-focus alternative slips launch by ${formatDurationWeeks(
              Math.abs(launchDelta)
            )}.`
        : " The tighter-focus alternative lands in roughly the same launch window.";
  }

  refs.curveSummary.textContent = `${candidate.label} lands in about ${formatDurationWeeks(
    candidate.cumulativeWeeks
  )} and public launch in about ${formatDurationWeeks(
    launch.cumulativeWeeks
  )} if work started today.${saturationText}${focusedText}`;
}

function drawTimelinePath(context, milestones, xScale, yScale, stroke, fill, options = {}) {
  context.save();
  context.beginPath();

  milestones.forEach((milestone, index) => {
    const x = xScale(index);
    const y = yScale(milestone.cumulativeWeeks);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  if (fill) {
    const lastX = xScale(milestones.length - 1);
    const firstX = xScale(0);
    const baseline = yScale(0);
    context.lineTo(lastX, baseline);
    context.lineTo(firstX, baseline);
    context.closePath();
    context.fillStyle = fill;
    context.fill();

    context.beginPath();
    milestones.forEach((milestone, index) => {
      const x = xScale(index);
      const y = yScale(milestone.cumulativeWeeks);

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

function drawTimelineMarkers(context, milestones, xScale, yScale, color, options = {}) {
  context.save();
  milestones.forEach((milestone, index) => {
    const x = xScale(index);
    const y = yScale(milestone.cumulativeWeeks);
    const radius = index === milestones.length - 1 ? 6.5 : 5;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);

    if (options.hollow) {
      context.fillStyle = "#fff";
      context.strokeStyle = color;
      context.lineWidth = 2.5;
      context.fill();
      context.stroke();
    } else {
      context.fillStyle = color;
      context.fill();
    }
  });
  context.restore();
}

function drawChart(timeline, focusedTimeline) {
  const canvas = refs.chart;
  const context = canvas.getContext("2d");
  const devicePixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * devicePixelRatio);
  canvas.height = Math.floor(height * devicePixelRatio);
  context.scale(devicePixelRatio, devicePixelRatio);
  context.clearRect(0, 0, width, height);

  const padding = { top: 24, right: 26, bottom: 52, left: 64 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxWeeks = Math.max(
    timeline.publicLaunch.cumulativeWeeks,
    focusedTimeline ? focusedTimeline.publicLaunch.cumulativeWeeks : 0,
    8
  );

  const xScale = (index) =>
    padding.left + (index / Math.max(timeline.milestones.length - 1, 1)) * chartWidth;
  const yScale = (value) =>
    padding.top + chartHeight - (value / (maxWeeks * 1.08)) * chartHeight;

  context.strokeStyle = "rgba(31, 36, 48, 0.12)";
  context.fillStyle = "rgba(94, 102, 114, 0.9)";
  context.font = '12px Aptos, "Segoe UI", sans-serif';

  for (let step = 0; step <= 4; step += 1) {
    const value = (maxWeeks * step) / 4;
    const y = yScale(value);
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(formatDurationWeeks(value), 12, y + 4);
  }

  context.save();
  context.textAlign = "center";
  context.fillStyle = "rgba(31, 36, 48, 0.8)";
  timeline.milestones.forEach((milestone, index) => {
    context.fillText(milestone.shortLabel, xScale(index), height - 16);
  });
  context.restore();

  context.save();
  context.strokeStyle = "rgba(31, 36, 48, 0.22)";
  context.beginPath();
  context.moveTo(padding.left, yScale(0));
  context.lineTo(width - padding.right, yScale(0));
  context.stroke();
  context.restore();

  const fillGradient = context.createLinearGradient(0, padding.top, 0, height);
  fillGradient.addColorStop(0, "rgba(212, 95, 58, 0.2)");
  fillGradient.addColorStop(1, "rgba(212, 95, 58, 0.01)");
  drawTimelinePath(
    context,
    timeline.milestones,
    xScale,
    yScale,
    palette.focus,
    fillGradient
  );
  drawTimelineMarkers(context, timeline.milestones, xScale, yScale, palette.focus);

  if (state.showFocusedPath && focusedTimeline) {
    drawTimelinePath(
      context,
      focusedTimeline.milestones,
      xScale,
      yScale,
      palette.coupling,
      null,
      {
        dashed: true,
        lineWidth: 2.5,
      }
    );
    drawTimelineMarkers(
      context,
      focusedTimeline.milestones,
      xScale,
      yScale,
      palette.coupling,
      { hollow: true }
    );
  }

  const currentLaunchX = xScale(timeline.milestones.length - 1);
  const currentLaunchY = yScale(timeline.publicLaunch.cumulativeWeeks);
  context.save();
  context.textAlign = "right";
  context.fillStyle = "rgba(31, 36, 48, 0.9)";
  context.fillText(
    `launch ${formatDate(timeline.publicLaunch.date)}`,
    currentLaunchX - 8,
    currentLaunchY - 12
  );
  context.restore();

  if (state.showFocusedPath && focusedTimeline) {
    const focusedLaunchX = xScale(focusedTimeline.milestones.length - 1);
    const focusedLaunchY = yScale(focusedTimeline.publicLaunch.cumulativeWeeks);
    context.save();
    context.textAlign = "right";
    context.fillStyle = palette.coupling;
    context.fillText(
      `focused ${formatDate(focusedTimeline.publicLaunch.date)}`,
      focusedLaunchX - 8,
      focusedLaunchY + 20
    );
    context.restore();
  }
}

function render() {
  syncInputsToState();
  refs.focusedLegend.classList.toggle("is-hidden", !state.showFocusedPath);

  const currentContributors = state[state.mode].contributors;
  const current = buildSnapshot(state.mode, currentContributors, state);
  const peak = peakSnapshot(buildSeries(state.mode, state));
  const timeline = buildMilestoneTimeline(current, state);

  let focusedCurrent = null;
  let focusedTimeline = null;

  if (state.showFocusedPath) {
    const focusedState = focusedVariant(state);
    focusedCurrent = buildSnapshot(
      state.mode,
      currentContributors,
      focusedState
    );
    focusedTimeline = buildMilestoneTimeline(focusedCurrent, focusedState);
  }

  renderMilestoneCards(current, timeline, focusedCurrent, focusedTimeline);
  renderBreakdown(current);
  renderDiagnosis(current, peak, timeline, focusedTimeline);
  renderLaunchSummary(current, peak, timeline, focusedTimeline);
  drawChart(timeline, focusedTimeline);
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
