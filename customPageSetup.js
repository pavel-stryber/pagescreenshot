module.exports = async ({ page }) => {
  await page.addStyleTag({ path: './styles.css' });
  const [button] = await page.$x("//button[contains(., 'Sounds good')]");
  await button.click();
};
