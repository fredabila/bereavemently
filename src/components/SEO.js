import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
  const defaultTitle = 'Bereavemently - AI-Powered Grief Support';
  const defaultDescription = 'Find 24/7 support through your grief journey with Bereavemently\'s AI-powered counseling platform.';
  const defaultImage = 'https://i.ibb.co/b1c3tKS/Black-White-Minimalist-Business-Logo-removebg-preview.png';
  const defaultUrl = 'https://bereavemently.ai';

  return (
    <Helmet>
      <title>{title || defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords} />
      
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:url" content={url || defaultUrl} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
    </Helmet>
  );
};

export default SEO; 