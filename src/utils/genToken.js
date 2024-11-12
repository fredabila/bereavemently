const genToken = async () => {
    const response = await fetch(
      `https://buzzchat.site/token.php`,
      {
        method: "POST",
      }
    );
  
    const res = await response.json();
  
    return res.access_token;
  };
  
  export default genToken;
  