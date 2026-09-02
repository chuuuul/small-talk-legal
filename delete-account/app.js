(() => {
  'use strict';

  const form = document.getElementById('delete-form');
  const status = document.getElementById('status');
  const apiBaseUrl = String(window.SMALL_TALK_API_BASE_URL || '').replace(/\/$/, '');

  function show(message) {
    status.textContent = message;
  }

  async function parseError(response) {
    try {
      const payload = await response.json();
      return typeof payload.detail === 'string' ? payload.detail : '요청을 처리하지 못했습니다.';
    } catch {
      return '요청을 처리하지 못했습니다.';
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmationInput = document.getElementById('confirmation');

    if (!apiBaseUrl || !apiBaseUrl.startsWith('https://')) {
      show('비공개 테스트 서버가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (confirmationInput.value.trim() !== '삭제') {
      show('확인란에 ‘삭제’를 정확히 입력해 주세요.');
      return;
    }

    button.disabled = true;
    show('계정을 확인하고 있습니다.');
    let token = '';
    try {
      const login = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value }),
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      passwordInput.value = '';
      if (!login.ok) throw new Error(await parseError(login));
      const auth = await login.json();
      if (typeof auth.access_token !== 'string' || !auth.access_token) {
        throw new Error('인증 응답이 올바르지 않습니다.');
      }
      token = auth.access_token;

      const deletion = await fetch(`${apiBaseUrl}/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      token = '';
      if (deletion.status !== 204) throw new Error(await parseError(deletion));

      form.reset();
      form.hidden = true;
      show('계정과 사용자에게 귀속된 데이터가 삭제되었습니다.');
    } catch (error) {
      token = '';
      show(error instanceof Error ? error.message : '계정 삭제에 실패했습니다.');
      button.disabled = false;
    }
  });
})();
