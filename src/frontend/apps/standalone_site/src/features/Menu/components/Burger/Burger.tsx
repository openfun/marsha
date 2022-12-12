import { SVGProps } from 'react';

import { ReactComponent as BurgerIcon } from 'assets/svg/burger.svg';
import { useMenu } from 'features/Menu/store/menuStore';
import { useResponsive } from 'hooks/useResponsive';

import styles from './Burger.module.css';

type BurgerProps = SVGProps<SVGSVGElement>;

const Burger = (props: BurgerProps) => {
  const { isDesktop } = useResponsive();
  const { isMenuOpen, switchMenuOpen } = useMenu();

  return (
    <BurgerIcon
      role="button"
      className={`${styles.burgerIcon} ${
        isMenuOpen(isDesktop) ? styles.open : ''
      }`}
      onClick={switchMenuOpen}
      {...props}
    />
  );
};

export default Burger;
