const form = document.querySelector('#inquiry-form');
const statusBox = document.querySelector('#form-status');
let acceptingInquiries = false;

async function checkInquiryAvailability() {
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  try {
    const response = await fetch('/api/health', {cache: 'no-store', credentials: 'same-origin'});
    const health = response.ok ? await response.json() : {};
    acceptingInquiries = health.database === 'ready';
  } catch (_) {
    acceptingInquiries = false;
  }
  if (!acceptingInquiries) {
    button.disabled = true;
    statusBox.textContent = 'Ön talep formu henüz aktif değil. Veritabanı bağlantısı doğrulanınca açılacaktır.';
    statusBox.dataset.state = 'error';
  } else {
    button.disabled = false;
    statusBox.textContent = '';
    statusBox.dataset.state = '';
  }
}

if (form) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  void checkInquiryAvailability();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!acceptingInquiries) {
      statusBox.textContent = 'Ön talep formu henüz aktif değil. Bilgileriniz kaydedilmedi.';
      statusBox.dataset.state = 'error';
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.consent) {
      statusBox.textContent = 'Bilgilendirmeyi kabul etmeden talep gönderilemez.';
      statusBox.dataset.state = 'error';
      return;
    }
    data.consent = true;
    if (data.description?.trim().length < 20) {
      statusBox.textContent = 'Lütfen ihtiyacınızı en az 20 karakterle anlatın.';
      statusBox.dataset.state = 'error';
      return;
    }
    button.disabled = true;
    statusBox.textContent = 'Talebiniz güvenli şekilde gönderiliyor...';
    statusBox.dataset.state = 'pending';
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
        credentials: 'same-origin'
      });
      if (response.ok) {
        const json = await response.json();
        if (json.received && json.reference) {
          statusBox.textContent = `Talebiniz kaydedildi. Referans: ${json.reference}`;
          statusBox.dataset.state = 'success';
          form.reset();
        } else {
          statusBox.textContent = 'Talep kayıt doğrulaması başarısız. Lütfen tekrar deneyin.';
          statusBox.dataset.state = 'error';
        }
      } else {
        const message = (await response.json().catch(() => ({}))).detail;
        statusBox.textContent = typeof message === 'string' ? message : 'Talep kaydedilemedi. Lütfen daha sonra tekrar deneyin.';
        statusBox.dataset.state = 'error';
      }
    } catch (_) {
      statusBox.textContent = 'Sunucuya erişilemedi. Talep kaydedilmedi; lütfen daha sonra tekrar deneyin.';
      statusBox.dataset.state = 'error';
    } finally {
      button.disabled = !acceptingInquiries;
    }
  });
}

// Only explicitly approved, non-demo projects can be shown by the server.
async function loadApprovedProjects() {
  const target = document.querySelector('#project-results');
  if (!target) return;
  try {
    const response = await fetch('/api/projects', {cache: 'no-store'});
    if (!response.ok) throw new Error('projects unavailable');
    const json = await response.json();
    target.replaceChildren();
    if (!Array.isArray(json.projects) || json.projects.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'project-empty';
      msg.textContent = 'Şu anda yayın için onaylanmış proje bulunmuyor. İncelemesi tamamlanan fırsatlar burada gösterilecek.';
      target.append(msg);
      return;
    }
    for (const project of json.projects) {
      const card = document.createElement('article');
      card.className = 'project-card';
      const title = document.createElement('h3');
      title.textContent = project.title;
      const meta = document.createElement('p');
      meta.className = 'project-meta';
      meta.textContent = [project.city, project.trade].filter(Boolean).join(' • ');
      const summary = document.createElement('p');
      summary.textContent = project.scope_summary;
      card.append(title, meta, summary);
      if (typeof project.public_source_url === 'string' && /^https:\/\//.test(project.public_source_url)) {
        const link = document.createElement('a');
        link.href = project.public_source_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Resmî / kaynak ilanı incele ↗';
        card.append(link);
      }
      target.append(card);
    }
  } catch (_) {
    target.textContent = 'Proje listesi geçici olarak görüntülenemiyor.';
  }
}
void loadApprovedProjects();

const networkForm = document.querySelector('#network-form');
const networkStatus = document.querySelector('#network-status');
if (networkForm && networkStatus) {
  const submit = networkForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  fetch('/api/health', {cache: 'no-store'}).then(r => r.ok ? r.json() : {}).then(data => {
    if (data.database === 'ready') {
      submit.disabled = false;
    } else {
      networkStatus.textContent = 'Ön kayıt şu an aktif değil. Sunucu bağlantısı doğrulanınca açılacak.';
      networkStatus.dataset.state = 'error';
    }
  }).catch(() => {
    networkStatus.textContent = 'Şu anda sunucuya erişilemiyor; bilgi kaydedilmedi.';
    networkStatus.dataset.state = 'error';
  });
  networkForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !networkForm.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(networkForm).entries());
    payload.consent = !!payload.consent;
    if (!payload.consent) {
      networkStatus.textContent = 'Gizlilik bilgilendirmesini kabul etmek gerekiyor.';
      networkStatus.dataset.state = 'error';
      return;
    }
    submit.disabled = true;
    networkStatus.dataset.state = 'pending';
    networkStatus.textContent = 'Ön kayıt kaydediliyor…';
    try {
      const response = await fetch('/api/network-interest', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin', body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.received || !result.reference) {
        networkStatus.dataset.state = 'error';
        networkStatus.textContent = (typeof result.detail === 'string') ? result.detail : 'Ön kayıt doğrulanamadı; bilgileriniz kaydedilmemiş olabilir.';
        return;
      }
      networkStatus.dataset.state = 'success';
      networkStatus.textContent = `Ön kaydınız alındı. Referans: ${result.reference}. İnceleme bekliyor, üyelik henüz oluşturulmadı.`;
      networkForm.reset();
    } catch (_) {
      networkStatus.dataset.state = 'error';
      networkStatus.textContent = 'Bağlantı hatası. Ön kayıt onaylanmadı; tekrar deneyebilirsiniz.';
    } finally {
      submit.disabled = false;
    }
  });
}
