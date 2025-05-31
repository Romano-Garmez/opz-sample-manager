function createNumberInput(name, value, idx = null, subIdx = null) {
  const input = document.createElement('input');
  input.type = 'number';
  input.name = name;
  input.value = value;
  input.className = "w-16 p-1 border rounded";
  if (idx !== null) input.dataset.index = idx;
  if (subIdx !== null) input.dataset.subindex = subIdx;
  return input;
}

async function loadConfig(configName) {
  const res = await fetch(`/get-config/${configName}`);
  const config = await res.json();
  const form = document.getElementById('config-form');
  form.innerHTML = '';

  for (const [key, value] of Object.entries(config)) {
    const wrapper = document.createElement('div');
    wrapper.className = "mb-4";

    const label = document.createElement('label');
    label.textContent = key;
    label.className = "block font-medium mb-1 text-gray-800";

    wrapper.appendChild(label);

    if (typeof value === 'boolean') {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = key;
      checkbox.checked = value;
      checkbox.className = "toggle-checkbox";
      wrapper.appendChild(checkbox);

    } else if (typeof value === 'number') {
      wrapper.appendChild(createNumberInput(key, value));

    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = "flex flex-wrap gap-2 mb-1";

        if (Array.isArray(item)) {
          item.forEach((val, subIdx) => {
            row.appendChild(createNumberInput(key, val, idx, subIdx));
          });
        } else {
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
      // Always include booleans
      updatedConfig[key] = updatedConfig[key] ?? false;
      if (input.checked) updatedConfig[key] = true;

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
    body: JSON.stringify(updatedConfig, null, 2)
  });
});

// Load the desired config file on page load (replace as needed)
let currentConfigName = 'general';

document.getElementById('config-select').addEventListener('change', (e) => {
  currentConfigName = e.target.value;
  loadConfig(currentConfigName);
});

loadConfig(currentConfigName);