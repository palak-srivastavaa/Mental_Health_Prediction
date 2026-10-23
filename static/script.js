/**
 * MindPulse AI - Student Digital Wellbeing Platform
 * Interactive Controller, Audio Synthesis, Live HUD, What-If Simulator & Breathing Guide
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. Theme Switcher (Light / Dark Mode with Persistence)
  // =========================================================================
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIconLight = themeToggleBtn?.querySelector('.theme-icon-light');
  const themeIconDark = themeToggleBtn?.querySelector('.theme-icon-dark');
  const rootHtml = document.documentElement;

  function applyTheme(theme) {
    rootHtml.setAttribute('data-theme', theme);
    localStorage.setItem('mindpulse_theme', theme);
    if (theme === 'dark') {
      themeIconLight?.classList.add('hidden');
      themeIconDark?.classList.remove('hidden');
    } else {
      themeIconLight?.classList.remove('hidden');
      themeIconDark?.classList.add('hidden');
    }
  }

  const savedTheme = localStorage.getItem('mindpulse_theme') || 'light';
  applyTheme(savedTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = rootHtml.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });

  // =========================================================================
  // 3. Elements Selection
  // =========================================================================
  const form = document.getElementById('predict-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const resetBtn = document.getElementById('reset-btn');

  const stepView1 = document.getElementById('step-view-1');
  const stepView2 = document.getElementById('step-view-2');
  const backToStep1Btn = document.getElementById('back-to-step1-btn');
  const retakeBtn = document.getElementById('retake-btn');

  const inlineErrorBox = document.getElementById('inline-error-box');
  const inlineErrorList = document.getElementById('inline-error-list');

  // Report Elements
  const scoreValue = document.getElementById('score-value');
  const progressCircle = document.getElementById('progress-circle');
  const categoryBadge = document.getElementById('score-category-badge');
  const scoreSummary = document.getElementById('score-summary');
  const confidenceVal = document.getElementById('confidence-val');
  const confidenceBar = document.getElementById('confidence-bar');
  const treesEvaluatedNum = document.getElementById('trees-evaluated-num');

  const metricRatio = document.getElementById('metric-ratio');
  const metricRatioSub = document.getElementById('metric-ratio-sub');
  const metricUnlocks = document.getElementById('metric-unlocks');
  const metricStress = document.getElementById('metric-stress');

  const counselorAlert = document.getElementById('counselor-alert');
  const recommendationsList = document.getElementById('recommendations-list');
  const goalsCommittedCount = document.getElementById('goals-committed-count');
  const goalsTotalCount = document.getElementById('goals-total-count');

  // Simulator Elements
  const simSleepDelta = document.getElementById('sim-sleep-delta');
  const simSleepDeltaVal = document.getElementById('sim-sleep-delta-val');
  const simScreenDelta = document.getElementById('sim-screen-delta');
  const simScreenDeltaVal = document.getElementById('sim-screen-delta-val');
  const runSimulationBtn = document.getElementById('run-simulation-btn');
  const simSpinner = document.getElementById('sim-spinner');
  const simResultBadge = document.getElementById('sim-result-badge');
  const simDiffText = document.getElementById('sim-diff-text');

  // Live Vitality Matrix Elements
  const vSleepStat = document.getElementById('v-sleep-stat');
  const vScreenStat = document.getElementById('v-screen-stat');
  const vExerciseStat = document.getElementById('v-exercise-stat');
  const vResilienceStat = document.getElementById('v-resilience-stat');



  // Progress ring circumference for Hero Gauge: 2 * pi * 58 ≈ 364.42
  const CIRCUMFERENCE = 364.42;
  if (progressCircle) {
    progressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  }


  // Active user payload cache for What-If simulator
  let latestPayload = null;
  let latestBaseScore = 0;

  // =========================================================================
  // 4. Interactive Sliders & Live Two-Way Binding
  // =========================================================================
  const slidersConfig = [
    {
      id: 'Sleep_Hours_Per_Night',
      valId: 'Sleep_Hours_Per_Night_val',
      tagId: 'sleep-status-tag',
      unit: 'hrs',
      getTag: (val) => {
        if (val < 6.0) return { text: 'Sleep Deficit (<6.0h)', class: 'warning' };
        if (val < 7.0) return { text: 'Borderline Duration (Aim for 7h+)', class: 'moderate' };
        if (val <= 9.0) return { text: 'Clinical Optimal (7.0–9.0h)', class: 'healthy' };
        return { text: 'Extended Sleep Duration', class: 'moderate' };
      }
    },
    {
      id: 'Avg_Daily_Usage_Hours',
      valId: 'Avg_Daily_Usage_Hours_val',
      tagId: 'screen-status-tag',
      unit: 'hrs',
      getTag: (val) => {
        if (val <= 2.0) return { text: 'Low Digital Exposure (<=2.0h)', class: 'healthy' };
        if (val <= 3.5) return { text: 'Moderate Screen Usage', class: 'moderate' };
        if (val <= 6.0) return { text: 'Elevated Cognitive Screen Load (>3.5h)', class: 'warning' };
        return { text: 'High Screen Immersion', class: 'warning' };
      }
    },
    {
      id: 'Daily_Unlocks',
      valId: 'Daily_Unlocks_val',
      tagId: 'unlocks-status-tag',
      unit: '',
      getTag: (val) => {
        if (val <= 30) return { text: 'Focused Attention (Low interruptions)', class: 'healthy' };
        if (val <= 70) return { text: 'Standard Routine Checks (35–70)', class: 'moderate' };
        return { text: 'High Task Fragmentation (>70 checks)', class: 'warning' };
      }
    },
    {
      id: 'Study_Hours',
      valId: 'Study_Hours_val',
      tagId: 'study-status-tag',
      unit: 'hrs',
      getTag: (val) => {
        if (val < 2.0) return { text: 'Light Study Schedule', class: 'moderate' };
        if (val <= 6.0) return { text: 'Standard Study Schedule (2.0–6.0h)', class: 'healthy' };
        return { text: 'Intensive Academic Schedule', class: 'warning' };
      }
    },
    {
      id: 'Physical_Activity_Hours',
      valId: 'Physical_Activity_Hours_val',
      tagId: 'exercise-status-tag',
      unit: 'hrs',
      getTag: (val) => {
        if (val === 0) return { text: 'Sedentary (Activity recommended)', class: 'warning' };
        if (val <= 2.0) return { text: 'Active & Conditioning (1.0–2.0h)', class: 'healthy' };
        return { text: 'High Physical Conditioning', class: 'healthy' };
      }
    }
  ];

  slidersConfig.forEach(cfg => {
    const slider = document.getElementById(cfg.id);
    const valDisplay = document.getElementById(cfg.valId);
    const tagDisplay = document.getElementById(cfg.tagId);

    if (slider) {
      slider.addEventListener('input', () => {
        const numVal = parseFloat(slider.value);
        if (valDisplay) valDisplay.textContent = Number.isInteger(numVal) ? numVal : numVal.toFixed(1);
        
        if (tagDisplay && cfg.getTag) {
          const tagInfo = cfg.getTag(numVal);
          tagDisplay.textContent = tagInfo.text;
          tagDisplay.className = `slider-tag ${tagInfo.class}`;
        }

        updateVitalityMatrix();
      });
    }
  });

  // =========================================================================
  // 5. Interactive Segmented Buttons & Chips
  // =========================================================================
  function initSelectorGroup(containerSelector, hiddenInputId) {
    const container = document.querySelector(containerSelector);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!container || !hiddenInput) return;

    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.getAttribute('data-val');
        hiddenInput.value = val;
        updateVitalityMatrix();
      });
    });
  }

  initSelectorGroup('.segmented-control[data-for="Gender"]', 'Gender');
  initSelectorGroup('.segmented-control[data-for="Academic_Level"]', 'Academic_Level');
  initSelectorGroup('.stress-compact-grid', 'Stress_Level');
  initSelectorGroup('.stress-cards-grid', 'Stress_Level');

  // Dropdown change listeners
  ['Most_Used_Platform', 'Purpose_Of_Use'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('change', () => {
      updateVitalityMatrix();
    });
  });

  // =========================================================================
  // 6. Interactive Archetype Personas
  // =========================================================================
  const archetypes = {
    balanced: {
      Age: 21,
      Gender: 'Female',
      Country: 'USA',
      Academic_Level: 'Undergraduate',
      Sleep_Hours_Per_Night: 7.5,
      Avg_Daily_Usage_Hours: 2.5,
      Daily_Unlocks: 35,
      Study_Hours: 4.0,
      Physical_Activity_Hours: 1.5,
      Stress_Level: 'Low',
      Most_Used_Platform: 'Instagram',
      Purpose_Of_Use: 'Entertainment'
    },
    nightowl: {
      Age: 20,
      Gender: 'Male',
      Country: 'USA',
      Academic_Level: 'Undergraduate',
      Sleep_Hours_Per_Night: 4.5,
      Avg_Daily_Usage_Hours: 5.5,
      Daily_Unlocks: 75,
      Study_Hours: 5.0,
      Physical_Activity_Hours: 0.5,
      Stress_Level: 'High',
      Most_Used_Platform: 'YouTube',
      Purpose_Of_Use: 'Education'
    },
    overload: {
      Age: 19,
      Gender: 'Other',
      Country: 'USA',
      Academic_Level: 'High School',
      Sleep_Hours_Per_Night: 5.0,
      Avg_Daily_Usage_Hours: 8.0,
      Daily_Unlocks: 120,
      Study_Hours: 2.0,
      Physical_Activity_Hours: 0.0,
      Stress_Level: 'Very High',
      Most_Used_Platform: 'TikTok',
      Purpose_Of_Use: 'Entertainment'
    },
    active: {
      Age: 22,
      Gender: 'Female',
      Country: 'USA',
      Academic_Level: 'Graduate',
      Sleep_Hours_Per_Night: 8.0,
      Avg_Daily_Usage_Hours: 2.0,
      Daily_Unlocks: 25,
      Study_Hours: 6.0,
      Physical_Activity_Hours: 2.5,
      Stress_Level: 'Medium',
      Most_Used_Platform: 'LinkedIn',
      Purpose_Of_Use: 'Networking'
    }
  };

  const archetypeBtns = document.querySelectorAll('.archetype-btn');
  archetypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      archetypeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const archKey = btn.getAttribute('data-archetype');
      const data = archetypes[archKey];
      if (!data) return;

      applyFormData(data);
      showToast(`Preset loaded: "${btn.textContent.trim()}"`);
    });
  });

  function applyFormData(data) {
    // Demographics
    const ageInput = document.getElementById('Age');
    if (ageInput && data.Age) ageInput.value = data.Age;
    
    const countryInput = document.getElementById('Country');
    if (countryInput && data.Country) countryInput.value = data.Country;

    // Segmented / Radio buttons
    function setSelectorActive(dataFor, value) {
      const container = document.querySelector(`[data-for="${dataFor}"]`);
      const hiddenInput = document.getElementById(dataFor);
      if (container && hiddenInput && value) {
        hiddenInput.value = value;
        container.querySelectorAll('button').forEach(btn => {
          if (btn.getAttribute('data-val') === value) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    }

    setSelectorActive('Gender', data.Gender);
    setSelectorActive('Academic_Level', data.Academic_Level);
    setSelectorActive('Stress_Level', data.Stress_Level);

    const platformSelect = document.getElementById('Most_Used_Platform');
    if (platformSelect && data.Most_Used_Platform) platformSelect.value = data.Most_Used_Platform;

    const purposeSelect = document.getElementById('Purpose_Of_Use');
    if (purposeSelect && data.Purpose_Of_Use) purposeSelect.value = data.Purpose_Of_Use;

    // Sliders
    slidersConfig.forEach(cfg => {
      const val = data[cfg.id];
      if (val !== undefined) {
        const slider = document.getElementById(cfg.id);
        const valDisplay = document.getElementById(cfg.valId);
        const tagDisplay = document.getElementById(cfg.tagId);

        if (slider) slider.value = val;
        if (valDisplay) valDisplay.textContent = Number.isInteger(val) ? val : val.toFixed(1);
        if (tagDisplay && cfg.getTag) {
          const tagInfo = cfg.getTag(val);
          tagDisplay.textContent = tagInfo.text;
          tagDisplay.className = `slider-tag ${tagInfo.class}`;
        }
      }
    });

    updateVitalityMatrix();
  }

  // =========================================================================
  // 7. Real-Time Vitality & Benchmarks Matrix Calculation
  // =========================================================================
  function updateVitalityMatrix() {
    const sleep = parseFloat(document.getElementById('Sleep_Hours_Per_Night')?.value || '7');
    const screen = parseFloat(document.getElementById('Avg_Daily_Usage_Hours')?.value || '4');
    const unlocks = parseInt(document.getElementById('Daily_Unlocks')?.value || '45', 10);
    const exercise = parseFloat(document.getElementById('Physical_Activity_Hours')?.value || '1.5');
    const stress = document.getElementById('Stress_Level')?.value || 'Medium';

    // Cognitive Fatigue Index (Screen + Unlocks + Stress factor)
    let stressFactor = 15;
    if (stress === 'Medium') stressFactor = 30;
    if (stress === 'High') stressFactor = 50;
    if (stress === 'Very High') stressFactor = 70;

    const screenFatigue = (screen / 12) * 50;
    const unlockFatigue = (unlocks / 200) * 30;
    const totalFatigue = Math.min(99, Math.round(screenFatigue + unlockFatigue + (stressFactor * 0.35)));

    // Rest & Physical Recovery
    const sleepScore = (Math.min(9, Math.max(4, sleep)) - 4) / 5 * 60; // 0-60 pts
    const exerciseScore = (Math.min(2.5, exercise) / 2.5) * 40; // 0-40 pts
    const recoveryTotal = Math.min(99, Math.round(sleepScore + exerciseScore));

    const vitalityScore = Math.round(Math.max(15, Math.min(98, (recoveryTotal * 0.6) + ((100 - totalFatigue) * 0.4))));

    // Dynamic Bottom Vitality Matrix Strip
    const vSleepStat = document.getElementById('v-sleep-stat');
    if (vSleepStat) {
      if (sleep >= 7.0 && sleep <= 9.0) {
        vSleepStat.innerHTML = `${sleep.toFixed(1)}h &bull; <span class="v-tag good">Optimal Window</span>`;
      } else if (sleep >= 6.0) {
        vSleepStat.innerHTML = `${sleep.toFixed(1)}h &bull; <span class="v-tag moderate">Borderline Rest</span>`;
      } else {
        vSleepStat.innerHTML = `${sleep.toFixed(1)}h &bull; <span class="v-tag warning">Sleep Deficit</span>`;
      }
    }

    const vScreenStat = document.getElementById('v-screen-stat');
    if (vScreenStat) {
      if (screen <= 2.5) {
        vScreenStat.innerHTML = `${screen.toFixed(1)}h/day &bull; <span class="v-tag good">Healthy Balance</span>`;
      } else if (screen <= 4.0) {
        vScreenStat.innerHTML = `${screen.toFixed(1)}h/day &bull; <span class="v-tag moderate">Moderate Load</span>`;
      } else {
        vScreenStat.innerHTML = `${screen.toFixed(1)}h/day &bull; <span class="v-tag warning">Heavy Screen Time</span>`;
      }
    }

    const vExerciseStat = document.getElementById('v-exercise-stat');
    if (vExerciseStat) {
      const weeklyHours = (exercise * 7).toFixed(1);
      if (exercise >= 1.0) {
        vExerciseStat.innerHTML = `${exercise.toFixed(1)}h &bull; <span class="v-tag good">${weeklyHours} hrs / week</span>`;
      } else if (exercise >= 0.5) {
        vExerciseStat.innerHTML = `${exercise.toFixed(1)}h &bull; <span class="v-tag moderate">${weeklyHours} hrs / week</span>`;
      } else {
        vExerciseStat.innerHTML = `${exercise.toFixed(1)}h &bull; <span class="v-tag warning">Sedentary Pace</span>`;
      }
    }

    const vResilienceStat = document.getElementById('v-resilience-stat');
    if (vResilienceStat) {
      if (vitalityScore >= 75) {
        vResilienceStat.innerHTML = `Top 15% &bull; <span class="v-tag good">High Vitality</span>`;
      } else if (vitalityScore >= 50) {
        vResilienceStat.innerHTML = `Top 40% &bull; <span class="v-tag moderate">Manageable Baseline</span>`;
      } else {
        vResilienceStat.innerHTML = `Attention Needed &bull; <span class="v-tag warning">Strained Pattern</span>`;
      }
    }
  }

  // Trigger initial calculation
  updateVitalityMatrix();

  // Reset Button
  resetBtn?.addEventListener('click', () => {
    form.reset();
    applyFormData(archetypes.balanced);
    if (inlineErrorBox) inlineErrorBox.classList.add('hidden');
    showToast('Reset to default values');
  });



  // =========================================================================
  // 9. Step Transitions
  // =========================================================================
  function switchToStep2() {
    if (!stepView1 || !stepView2) return;
    stepView1.classList.add('fade-leaving');

    setTimeout(() => {
      stepView1.classList.remove('active', 'fade-leaving');
      stepView1.classList.add('hidden');

      stepView2.classList.remove('hidden');
      stepView2.classList.add('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 220);
  }

  function switchToStep1() {
    if (!stepView1 || !stepView2) return;
    stepView2.classList.add('fade-leaving');

    setTimeout(() => {
      stepView2.classList.remove('active', 'fade-leaving');
      stepView2.classList.add('hidden');

      stepView1.classList.remove('hidden');
      stepView1.classList.add('active');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 220);
  }

  backToStep1Btn?.addEventListener('click', switchToStep1);
  retakeBtn?.addEventListener('click', switchToStep1);

  // =========================================================================
  // 10. Form Submission & Prediction Handler
  // =========================================================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (inlineErrorBox) inlineErrorBox.classList.add('hidden');

    const payload = extractFormData();
    setLoading(true);

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        handleErrorResponse(response.status, data);
      } else {
        latestPayload = { ...payload };
        latestBaseScore = data.prediction;
        
        renderSuccessReport(data, payload);
        switchToStep2();
      }
    } catch (netErr) {
      handleErrorResponse(0, {
        detail: 'Unable to reach the prediction service. Please ensure the local server is running.'
      });
    } finally {
      setLoading(false);
    }
  });

  function extractFormData() {
    return {
      Age: Number(document.getElementById('Age')?.value || 21),
      Gender: document.getElementById('Gender')?.value || 'Female',
      Country: document.getElementById('Country')?.value || 'USA',
      Academic_Level: document.getElementById('Academic_Level')?.value || 'Undergraduate',
      Study_Hours: parseFloat(document.getElementById('Study_Hours')?.value || 3.5),
      Avg_Daily_Usage_Hours: parseFloat(document.getElementById('Avg_Daily_Usage_Hours')?.value || 4.0),
      Daily_Unlocks: Number(document.getElementById('Daily_Unlocks')?.value || 45),
      Physical_Activity_Hours: parseFloat(document.getElementById('Physical_Activity_Hours')?.value || 1.5),
      Sleep_Hours_Per_Night: parseFloat(document.getElementById('Sleep_Hours_Per_Night')?.value || 7.0),
      Stress_Level: document.getElementById('Stress_Level')?.value || 'Medium',
      Most_Used_Platform: document.getElementById('Most_Used_Platform')?.value || 'Instagram',
      Purpose_Of_Use: document.getElementById('Purpose_Of_Use')?.value || 'Entertainment'
    };
  }

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnSpinner.style.display = 'inline-block';
    } else {
      submitBtn.disabled = false;
      btnSpinner.style.display = 'none';
    }
  }

  // =========================================================================
  // 11. Render Assessment Report & Animated Radial Counter
  // =========================================================================
  function renderSuccessReport(data, payload) {
    // Timestamp
    const reportTimestamp = document.getElementById('report-timestamp');
    if (reportTimestamp) {
      const now = new Date();
      reportTimestamp.textContent = `Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Animate score counter smoothly
    animateNumber(scoreValue, 1.0, data.prediction, 1200, 1);
    setHeroScoreProgress(data.prediction);

    // Meta & category
    if (categoryBadge) {
      categoryBadge.textContent = data.category;
      let badgeCls = 'category-pill moderate';
      if (data.prediction >= 8.0) badgeCls = 'category-pill thriving';
      else if (data.prediction >= 6.5) badgeCls = 'category-pill good';
      else if (data.prediction >= 5.0) badgeCls = 'category-pill moderate';
      else badgeCls = 'category-pill at-risk';
      categoryBadge.className = badgeCls;
    }

    if (scoreSummary) scoreSummary.textContent = data.summary;

    // Confidence
    if (confidenceVal) confidenceVal.textContent = `${data.confidence.toFixed(1)}%`;
    if (confidenceBar) confidenceBar.style.width = `${Math.min(100, Math.max(10, data.confidence))}%`;

    if (treesEvaluatedNum && data.details?.trees_evaluated) {
      treesEvaluatedNum.textContent = data.details.trees_evaluated;
    }

    // Mini habit metrics
    const ratioVal = (payload.Avg_Daily_Usage_Hours / Math.max(0.5, payload.Sleep_Hours_Per_Night)).toFixed(2);
    if (metricRatio) metricRatio.textContent = `${ratioVal}x`;
    if (metricRatioSub) {
      metricRatioSub.textContent = parseFloat(ratioVal) > 1.0 ? 'High Screen Burden' : 'Healthy Balance';
    }

    if (metricUnlocks) metricUnlocks.textContent = payload.Daily_Unlocks;
    if (metricStress) metricStress.textContent = payload.Stress_Level;

    // Counselor Alert Banner
    if (counselorAlert) {
      if (data.suggest_counselor) {
        counselorAlert.classList.remove('hidden');
      } else {
        counselorAlert.classList.add('hidden');
      }
    }

    // Render Recommendations as Interactive Action Plan
    renderInteractiveRecommendations(data.recommendations || []);

    // Reset simulator result badge
    if (simResultBadge) simResultBadge.classList.add('hidden');
  }

  function setHeroScoreProgress(score) {
    const clamped = Math.max(0, Math.min(10, score));
    const offset = CIRCUMFERENCE - (clamped / 10) * CIRCUMFERENCE;
    if (progressCircle) {
      progressCircle.style.strokeDashoffset = offset;
      let strokeColor = '#10b981';
      if (clamped >= 8.0) strokeColor = '#10b981';
      else if (clamped >= 6.5) strokeColor = '#0284c7';
      else if (clamped >= 5.0) strokeColor = '#f59e0b';
      else strokeColor = '#e11d48';

      progressCircle.style.stroke = strokeColor;
    }
  }

  function animateNumber(element, start, end, duration, decimals = 1) {
    if (!element) return;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = start + (end - start) * eased;
      element.textContent = currentVal.toFixed(decimals);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = end.toFixed(decimals);
      }
    }
    requestAnimationFrame(update);
  }

  // =========================================================================
  // 12. Interactive Action Plan Checklist (Click to Commit)
  // =========================================================================
  function renderInteractiveRecommendations(recs) {
    if (!recommendationsList) return;
    recommendationsList.innerHTML = '';

    if (goalsTotalCount) goalsTotalCount.textContent = recs.length;
    if (goalsCommittedCount) goalsCommittedCount.textContent = '0';

    if (recs.length === 0) {
      recommendationsList.innerHTML = '<li class="rec-item">No specific adjustments needed! Keep up your exemplary lifestyle habits.</li>';
      return;
    }

    recs.forEach((recText) => {
      const li = document.createElement('li');
      li.className = 'rec-item';

      const checkbox = document.createElement('div');
      checkbox.className = 'rec-checkbox';
      checkbox.innerHTML = '✓';

      const content = document.createElement('div');
      content.className = 'rec-content';
      content.textContent = recText;

      li.appendChild(checkbox);
      li.appendChild(content);

      li.addEventListener('click', () => {
        li.classList.toggle('committed');
        if (li.classList.contains('committed')) {
          showToast('Recommendation marked as adopted');
        } else {
        }

        const committedTotal = recommendationsList.querySelectorAll('.rec-item.committed').length;
        if (goalsCommittedCount) goalsCommittedCount.textContent = committedTotal;
      });

      recommendationsList.appendChild(li);
    });
  }

  // =========================================================================
  // 13. Interactive What-If Habit Simulator
  // =========================================================================
  simSleepDelta?.addEventListener('input', () => {
    const val = parseFloat(simSleepDelta.value);
    if (simSleepDeltaVal) simSleepDeltaVal.textContent = `+${val.toFixed(1)} hr`;
  });

  simScreenDelta?.addEventListener('input', () => {
    const val = parseFloat(simScreenDelta.value);
    if (simScreenDeltaVal) simScreenDeltaVal.textContent = `-${val.toFixed(1)} hrs`;
  });

  runSimulationBtn?.addEventListener('click', async () => {
    if (!latestPayload) {
      showToast('Please submit an assessment first!');
      return;
    }

    const sleepAdd = parseFloat(simSleepDelta?.value || '0');
    const screenSub = parseFloat(simScreenDelta?.value || '0');

    // Create simulated clone
    const simPayload = {
      ...latestPayload,
      Sleep_Hours_Per_Night: Math.min(12, latestPayload.Sleep_Hours_Per_Night + sleepAdd),
      Avg_Daily_Usage_Hours: Math.max(0.5, latestPayload.Avg_Daily_Usage_Hours - screenSub)
    };

    if (simSpinner) simSpinner.classList.remove('hidden');
    runSimulationBtn.disabled = true;

    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simPayload)
      });

      if (!res.ok) throw new Error('Simulation failed');
      const simData = await res.json();

      const diff = simData.prediction - latestBaseScore;
      const diffFormatted = diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;

      if (simResultBadge && simDiffText) {
        simResultBadge.classList.remove('hidden');
        simDiffText.innerHTML = `Simulated Wellbeing Score: <strong>${simData.prediction.toFixed(1)}</strong> (<strong>${diffFormatted} Change</strong>)`;
        showToast(`Simulation complete: ${diffFormatted} score adjustment!`);
      }

    } catch (err) {
      showToast('Could not run simulation. Please try again.');
    } finally {
      if (simSpinner) simSpinner.classList.add('hidden');
      runSimulationBtn.disabled = false;
    }
  });

  // =========================================================================
  // 14. 4-7-8 Guided Breathing Meditation
  // =========================================================================
  const breathingModal = document.getElementById('breathing-modal');
  const launchBreathingBtn = document.getElementById('launch-breathing-btn');
  const closeBreathingModal = document.getElementById('close-breathing-modal');
  const startBreathingBtn = document.getElementById('start-breathing-btn');
  const stopBreathingBtn = document.getElementById('stop-breathing-btn');
  const breathBubble = document.getElementById('breath-bubble');
  const breathPhaseText = document.getElementById('breath-phase-text');
  const breathCountdown = document.getElementById('breath-countdown');

  let breathInterval = null;
  let isBreathingActive = false;

  launchBreathingBtn?.addEventListener('click', () => {
    breathingModal?.classList.remove('hidden');
  });

  closeBreathingModal?.addEventListener('click', stopBreathingCycle);

  function stopBreathingCycle() {
    if (breathInterval) clearInterval(breathInterval);
    isBreathingActive = false;
    if (breathBubble) breathBubble.className = 'breath-bubble';
    if (breathPhaseText) breathPhaseText.textContent = 'Ready?';
    if (breathCountdown) breathCountdown.textContent = 'Click Start';
    if (startBreathingBtn) startBreathingBtn.disabled = false;
    if (stopBreathingBtn) stopBreathingBtn.disabled = true;
    breathingModal?.classList.add('hidden');
  }

  stopBreathingBtn?.addEventListener('click', stopBreathingCycle);

  startBreathingBtn?.addEventListener('click', () => {
    isBreathingActive = true;
    startBreathingBtn.disabled = true;
    stopBreathingBtn.disabled = false;
    runBreathPhaseLoop();
  });

  function runBreathPhaseLoop() {
    if (!isBreathingActive) return;

    // Phase 1: Inhale 4s
    if (breathPhaseText) breathPhaseText.textContent = 'Inhale deeply...';
    if (breathBubble) breathBubble.className = 'breath-bubble inhale';

    let secLeft = 4;
    if (breathCountdown) breathCountdown.textContent = `${secLeft}s`;
    
    breathInterval = setInterval(() => {
      secLeft--;
      if (breathCountdown) breathCountdown.textContent = `${secLeft}s`;

      if (secLeft <= 0) {
        clearInterval(breathInterval);
        if (!isBreathingActive) return;

        // Phase 2: Hold 7s
        if (breathPhaseText) breathPhaseText.textContent = 'Hold breath...';
        if (breathBubble) breathBubble.className = 'breath-bubble hold';
        let holdSec = 7;
        if (breathCountdown) breathCountdown.textContent = `${holdSec}s`;

        breathInterval = setInterval(() => {
          holdSec--;
          if (breathCountdown) breathCountdown.textContent = `${holdSec}s`;

          if (holdSec <= 0) {
            clearInterval(breathInterval);
            if (!isBreathingActive) return;

            // Phase 3: Exhale 8s
            if (breathPhaseText) breathPhaseText.textContent = 'Exhale slowly...';
            if (breathBubble) breathBubble.className = 'breath-bubble exhale';
            let exhaleSec = 8;
            if (breathCountdown) breathCountdown.textContent = `${exhaleSec}s`;

            breathInterval = setInterval(() => {
              exhaleSec--;
              if (breathCountdown) breathCountdown.textContent = `${exhaleSec}s`;

              if (exhaleSec <= 0) {
                clearInterval(breathInterval);
                if (isBreathingActive) {
                  runBreathPhaseLoop(); // Loop to next round
                }
              }
            }, 1000);
          }
        }, 1000);
      }
    }, 1000);
  }

  // =========================================================================
  // 15. Counselor & Helplines Modal
  // =========================================================================
  const counselorModal = document.getElementById('counselor-modal');
  const openCounselorModalBtn = document.getElementById('open-counselor-modal-btn');
  const closeCounselorModal = document.getElementById('close-counselor-modal');
  const dismissCounselorModal = document.getElementById('dismiss-counselor-modal');

  openCounselorModalBtn?.addEventListener('click', () => {
    counselorModal?.classList.remove('hidden');
  });

  closeCounselorModal?.addEventListener('click', () => counselorModal?.classList.add('hidden'));
  dismissCounselorModal?.addEventListener('click', () => counselorModal?.classList.add('hidden'));

  // Close modals on escape key or clicking backdrop
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopBreathingCycle();
      counselorModal?.classList.add('hidden');
    }
  });

  [breathingModal, counselorModal].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        if (modal === breathingModal) stopBreathingCycle();
        else modal.classList.add('hidden');
      }
    });
  });


  // =========================================================================
  // 17. Toast Notifications
  // =========================================================================
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, duration = 3000) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // =========================================================================
  // 18. Inline Error Handling
  // =========================================================================
  const FIELD_NAMES = {
    'Age': 'Age',
    'Study_Hours': 'Daily Study Hours',
    'Avg_Daily_Usage_Hours': 'Social Screen Time',
    'Daily_Unlocks': 'Phone Unlocks',
    'Physical_Activity_Hours': 'Physical Activity',
    'Sleep_Hours_Per_Night': 'Nightly Sleep',
    'Stress_Level': 'Stress Level',
    'Gender': 'Gender',
    'Academic_Level': 'Academic Level'
  };

  function handleErrorResponse(status, errorData) {
    if (!inlineErrorBox || !inlineErrorList) return;
    inlineErrorList.innerHTML = '';

    if (status === 422 && Array.isArray(errorData.detail)) {
      errorData.detail.forEach(err => {
        const rawField = err.loc ? err.loc.filter(k => k !== 'body').pop() : '';
        const friendlyName = FIELD_NAMES[rawField] || rawField || 'Field';
        let userMsg = err.msg || 'Please enter a valid value.';
        if (err.type === 'greater_than_equal') userMsg = `Must be at least ${err.ctx?.ge}.`;
        else if (err.type === 'less_than_equal') userMsg = `Cannot exceed ${err.ctx?.le}.`;

        const li = document.createElement('li');
        li.innerHTML = `<strong>${friendlyName}:</strong> ${userMsg}`;
        inlineErrorList.appendChild(li);
      });
    } else {
      const msg = typeof errorData.detail === 'string'
        ? errorData.detail
        : 'An unexpected issue occurred while processing your assessment. Please verify your connection.';
      const li = document.createElement('li');
      li.textContent = msg;
      inlineErrorList.appendChild(li);
    }

    inlineErrorBox.classList.remove('hidden');
    inlineErrorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // =========================================================================
  // 19. Celebration Confetti Canvas
  // =========================================================================
  function triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#10b981', '#34d399', '#059669', '#38bdf8', '#fbbf24', '#f43f5e'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        radius: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        alpha: 1,
        gravity: 0.35,
        drag: 0.96
      });
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = 0;

      particles.forEach(p => {
        p.vx *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.012;

        if (p.alpha > 0) {
          active++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (active > 0) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(render);
  }

});
