function createNumberInput(name, value, idx = null, subIdx = null) {
  const input = document.createElement('input');
  input.type = 'number';
  input.name = name;
  input.value = value;
  input.className = "config-number-input";
  if (idx !== null) input.dataset.index = idx;
  if (subIdx !== null) input.dataset.subindex = subIdx;
  return input;
}

function createCheckboxInput(name, checked, idx = null) {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  input.checked = checked;
  input.className = "toggle-checkbox";
  if (idx !== null) input.dataset.index = idx;
  return input;
}

async function loadConfig(configName) {
  const res = await fetch(`/get-config/${configName}`);
  const config = await res.json();
  const form = document.getElementById('config-form');
  form.innerHTML = '';

  for (const [key, value] of Object.entries(config)) {
    const wrapper = document.createElement('div');
    wrapper.className = "config-item";

    const label = document.createElement('label');
    label.textContent = key;
    label.className = "block font-medium mb-1 text-gray-800";

    wrapper.appendChild(label);

    if (typeof value === 'boolean') {
      // Single boolean
      wrapper.appendChild(createCheckboxInput(key, value));

    } else if (typeof value === 'number') {
      // Single number
      wrapper.appendChild(createNumberInput(key, value));

    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = "config-array";

        if (Array.isArray(item)) {
          // Nested array (e.g. parameter_cc_out)
          item.forEach((val, subIdx) => {
            row.appendChild(createNumberInput(key, val, idx, subIdx));
          });
        } else if (typeof item === 'boolean') {
          // Flat array of booleans (e.g. track_enable)
          row.appendChild(createCheckboxInput(key, item, idx));
        } else {
          // Flat array of numbers (e.g. track_channels)
          row.appendChild(createNumberInput(key, item, idx));
        }

        wrapper.appendChild(row);
      });
    }

    form.appendChild(wrapper);
  }
}

document.getElementById('save-button').addEventListener('click', async () => {
  const inputs = document.querySelectorAll('#config-form input');
  const updatedConfig = {};

  inputs.forEach(input => {
    const key = input.name;
    const idx = input.dataset.index;
    const subIdx = input.dataset.subindex;

    if (input.type === 'checkbox') {
      if (idx !== undefined && idx !== null) {
        if (!Array.isArray(updatedConfig[key])) updatedConfig[key] = [];
        updatedConfig[key][idx] = input.checked;
      } else {
        updatedConfig[key] = input.checked;
      }

    } else if (input.type === 'number') {
      const num = parseInt(input.value);
      if (idx !== undefined && idx !== null) {
        if (!Array.isArray(updatedConfig[key])) updatedConfig[key] = [];
        if (subIdx !== undefined && subIdx !== null) {
          updatedConfig[key][idx] = updatedConfig[key][idx] ?? [];
          updatedConfig[key][idx][subIdx] = num;
        } else {
          updatedConfig[key][idx] = num;
        }
      } else {
        updatedConfig[key] = num;
      }
    }
  });

  await fetch(`/save-config/${currentConfigName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedConfig)
  });
});

// Set up config file selector and initial load
let currentConfigName = 'general';

document.getElementById('config-select').addEventListener('change', (e) => {
  currentConfigName = e.target.value;
  loadConfig(currentConfigName);
});

loadConfig(currentConfigName);


async function pollForMount(retries = 60, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch('/get-opz-mount-path');
            const data = await res.json();

            if (data["OPZ_MOUNT_PATH"]) {
                await loadConfig(currentConfigName);
                return;
            }
        } catch (err) {
            console.error("Failed to check mount path:", err);
        }
        await new Promise(r => setTimeout(r, delay));
    }

    console.warn("Mount path not found after polling.");
}
pollForMount();