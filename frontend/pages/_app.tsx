import React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import './globals.css'; // Import your global styles here


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Add your head tags (title, meta tags, etc.) here */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
