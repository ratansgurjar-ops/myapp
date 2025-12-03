// This page now redirects to the moved admin dashboard under /ad81188/admin/dashboard
import React from 'react';

export default function AdminRedirect(){
  return null;
}

export async function getServerSideProps(){
  return {
    redirect: {
      destination: '/ad81188/admin/dashboard',
      permanent: false
    }
  }
}
