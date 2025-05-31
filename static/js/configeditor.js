async function loadConfig() {
  const res = await fetch('/get-config/general'); // Flask route returns general.json
  const config = await res.json();
  const form = document.getElementById('config-form');
  form.innerHTML = '';

  for (const [key, value] of Object.entries(config)) {
    const label = document.createElement('label');
    label.className = "flex items-center justify-between bg-gray-100 px-4 py-2 rounded";
    label.innerHTML = `
      <span class="text-gray-800">${key}</span>
      <input type="checkbox" name="${key}" ${value ? 'checked' : ''} class="toggle-checkbox">
    `;
    form.appendChild(label);
  }
}

document.getElementById('save-button').addEventListener('click', async () => {
  const form = document.getElementById('config-form');
  const inputs = form.querySelectorAll('input[type="checkbox"]');
  const updatedConfig = {};

  inputs.forEach(input => {
    updatedConfig[input.name] = input.checked;
  });

  await fetch('/save-config/general', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedConfig)
  });
});


loadConfig();
