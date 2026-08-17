(() => {
  const client = window.whrSupabase;
  if (!client || client.__whrVisibilityPreservePatch) return;

  const originalFrom = client.from.bind(client);

  client.from = function(table) {
    const builder = originalFrom(table);
    if (table !== "army_lists" || !builder?.upsert) return builder;

    const originalUpsert = builder.upsert.bind(builder);

    builder.upsert = async function(values, options) {
      async function preserveVisibility(row) {
        if (!row || typeof row !== "object" || row.visibility != null || !row.id) return row;

        const { data, error } = await originalFrom("army_lists")
          .select("visibility")
          .eq("id", row.id)
          .maybeSingle();

        if (!error && data?.visibility) {
          return { ...row, visibility: data.visibility };
        }

        // New armies remain private by default.
        return { ...row, visibility: "private" };
      }

      const patchedValues = Array.isArray(values)
        ? await Promise.all(values.map(preserveVisibility))
        : await preserveVisibility(values);

      return originalUpsert(patchedValues, options);
    };

    return builder;
  };

  client.__whrVisibilityPreservePatch = true;
})();
