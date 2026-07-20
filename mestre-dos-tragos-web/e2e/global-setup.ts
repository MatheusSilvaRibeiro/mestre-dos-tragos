import { chromium, type FullConfig } from '@playwright/test';
import { login } from './helpers/auth';
import { credenciaisAdmin, credenciaisAtendente, credenciaisCozinha } from './helpers/testData';
import { ADMIN_STORAGE_STATE, ATENDENTE_STORAGE_STATE, COZINHA_STORAGE_STATE } from './helpers/storageState';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';
  const browser = await chromium.launch();

  try {
    const admin = await browser.newPage({ baseURL });
    await login(admin, 'ADMIN', credenciaisAdmin());
    await admin.context().storageState({ path: ADMIN_STORAGE_STATE });
    await admin.close();

    const atendente = await browser.newPage({ baseURL });
    await login(atendente, 'ATENDENTE', credenciaisAtendente());
    await atendente.context().storageState({ path: ATENDENTE_STORAGE_STATE });
    await atendente.close();

    const cozinha = await browser.newPage({ baseURL });
    await login(cozinha, 'COZINHA', credenciaisCozinha());
    await cozinha.context().storageState({ path: COZINHA_STORAGE_STATE });
    await cozinha.close();
  } finally {
    await browser.close();
  }
}