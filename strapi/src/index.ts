import crypto from 'node:crypto';
import type { Core } from '@strapi/strapi';

const PUBLIC_PERMISSIONS: Record<string, string[]> = {
  'api::telegram-user.telegram-user': ['find', 'findOne', 'create', 'update'],
  'api::theory.theory': ['find', 'findOne'],
  'api::video.video': ['find', 'findOne'],
  'api::exercise.exercise': ['find', 'findOne'],
  'api::test-question.test-question': ['find', 'findOne'],
  'api::task.task': ['find', 'findOne'],
};

async function setPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  for (const [contentType, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
    for (const action of actions) {
      const actionKey = `${contentType}.${action}`;

      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { role: publicRole.id, action: actionKey } });

      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { role: publicRole.id, action: actionKey },
        });
        strapi.log.info(`[bootstrap] Granted public permission: ${actionKey}`);
      }
    }
  }
}

async function hideTheoryOrderField(strapi: Core.Strapi) {
  const key = 'plugin_content_manager_configuration_content_types::api::theory.theory';
  const existing = await strapi.query('strapi::core-store').findOne({ where: { key } });

  const config = existing ? JSON.parse(existing.value as string) : {};
  const metadatas = config.metadatas ?? {};

  if (metadatas.order?.edit?.visible === false) return;

  metadatas.order = { ...(metadatas.order ?? {}), edit: { label: 'order', visible: false }, list: { label: 'order' } };
  config.metadatas = metadatas;

  if (existing) {
    await strapi.query('strapi::core-store').update({ where: { key }, data: { value: JSON.stringify(config) } });
  } else {
    await strapi.query('strapi::core-store').create({ data: { key, value: JSON.stringify(config), type: 'object', environment: null, tag: null } });
  }

  strapi.log.info('[bootstrap] Hidden order field from theory edit view');
}

async function ensureApiToken(strapi: Core.Strapi) {
  const rawToken = process.env.STRAPI_API_TOKEN;
  if (!rawToken) return;
  const normalizedToken = rawToken.replace(/^Bearer\s+/i, '').trim();
  if (!normalizedToken) return;

  const salt = process.env.API_TOKEN_SALT ?? 'changeme';

  // Strapi hashes tokens: sha512(token + salt)
  const hashedToken = crypto
    .createHmac('sha512', salt)
    .update(normalizedToken)
    .digest('hex');

  const existing = await strapi.query('admin::api-token').findOne({
    where: { accessKey: hashedToken },
  });

  if (!existing) {
    await strapi.query('admin::api-token').create({
      data: {
        name: 'Bot API Token',
        description: 'Auto-created for bot access',
        type: 'full-access',
        accessKey: hashedToken,
        lastUsedAt: null,
      },
    });
    strapi.log.info('[bootstrap] Created bot API token');
  } else if (existing.type !== 'full-access') {
    await strapi.query('admin::api-token').update({
      where: { id: existing.id },
      data: { type: 'full-access' },
    });
    strapi.log.info('[bootstrap] Upgraded API token to full-access');
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);
    await ensureApiToken(strapi);
    await hideTheoryOrderField(strapi);
  },
};
