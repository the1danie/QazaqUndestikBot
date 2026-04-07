export default {
  async beforeCreate(event: { params: { data: { order?: number } } }) {
    if (event.params.data.order !== undefined && event.params.data.order !== 0) {
      return;
    }
    const entries = await strapi.documents("api::task.task").findMany({
      sort: { order: "desc" },
      limit: 1,
    });
    const maxOrder = entries.length > 0 ? (entries[0] as unknown as { order: number }).order : -1;
    event.params.data.order = maxOrder + 1;
  },
};
