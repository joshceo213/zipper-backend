app.get('/', (req, res) => {
  res.send('Zipper Backend is running 🚐');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
