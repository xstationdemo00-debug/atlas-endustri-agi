/** Only read flags are mutable by the original notification UI. */
export const canMarkSingleNotification = value =>
  value?.is_read === true && Object.keys(value).length === 1;
export const canMarkAllNotifications = (where, patch) =>
  where?.is_read === false && Object.keys(where).length === 1 &&
  patch?.$set?.is_read === true && Object.keys(patch).length === 1 &&
  Object.keys(patch.$set).length === 1;
