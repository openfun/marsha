import { MainLayout } from 'components/Layout';
import { Header } from 'features/Header';
import { HomePage } from 'features/HomePage';
import { Menu } from 'features/Menu';
import React from 'react';

function AppRoutes() {
  return (
    <MainLayout menu={<Menu />}>
      <Header />
      <HomePage />
    </MainLayout>
  );
}

export default AppRoutes;
