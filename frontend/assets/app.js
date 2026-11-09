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
