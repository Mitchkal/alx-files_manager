const formatFile = (file) => ({
  id: file._id,
  userId: file.userId,
  name: file.name,
  type: file.type,
  isPublic: file.isPublic,
  parentId: file.parentId,
});
export default formatFile;
