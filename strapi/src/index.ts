import type { Core } from '@strapi/strapi';

const PUBLIC_PERMISSIONS: Record<string, string[]> = {
  'api::telegram-user.telegram-user': ['find', 'findOne', 'create', 'update'],
  'api::theory.theory': ['find', 'findOne'],
  'api::video.video': ['find', 'findOne'],
  'api::exercise.exercise': ['find', 'findOne'],
  'api::test-question.test-question': ['find', 'findOne'],
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

async function upgradeApiTokensToFullAccess(strapi: Core.Strapi) {
  const tokens = await strapi.query('admin::api-token').findMany({
    where: { type: { $ne: 'full-access' } },
  });

  for (const token of tokens) {
    await strapi.query('admin::api-token').update({
      where: { id: token.id },
      data: { type: 'full-access', permissions: [] },
    });
    strapi.log.info(`[bootstrap] Upgraded API token "${token.name}" to full-access`);
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);
    await upgradeApiTokensToFullAccess(strapi);
  },
};
