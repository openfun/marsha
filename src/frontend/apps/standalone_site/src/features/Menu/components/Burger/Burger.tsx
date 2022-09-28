import { SVGProps } from 'react';

import { ReactComponent as BurgerIcon } from 'assets/svg/burger.svg';

import { useMenu } from '../../store/menuStore';

import styles from './Burger.module.css';

type BurgerProps = SVGProps<SVGSVGElement>;

function Burger(props: BurgerProps) {
  const { isMenuOpen, switchMenuOpen } = useMenu();

  return (
    <BurgerIcon
      role="button"
      className={`${styles.burgerIcon} ${isMenuOpen ? styles.open : ''}`}
      onClick={switchMenuOpen}
      {...props}
    />
  );
}

export default Burger;
