// Redirect /ad81188/admin -> /ad81188/admin/dashboard
import React from 'react';

export default function AdminIndexRedirect(){
  return null;
}

export async function getServerSideProps(){
  return {
    redirect: {
      destination: '/ad81188/admin/dashboard',
      permanent: false
    }
  };
}
