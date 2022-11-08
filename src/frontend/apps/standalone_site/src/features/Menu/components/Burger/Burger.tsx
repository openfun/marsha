import { ResponsiveContext } from 'grommet';
import { SVGProps, useContext } from 'react';

import { ReactComponent as BurgerIcon } from 'assets/svg/burger.svg';
import { useMenu } from 'features/Menu/store/menuStore';

import styles from './Burger.module.css';

type BurgerProps = SVGProps<SVGSVGElement>;

function Burger(props: BurgerProps) {
  const breakpoint = useContext(ResponsiveContext);
  const { isMenuOpen, switchMenuOpen } = useMenu();

  return (
    <BurgerIcon
      role="button"
      className={`${styles.burgerIcon} ${
        isMenuOpen(breakpoint) ? styles.open : ''
      }`}
      onClick={switchMenuOpen}
      {...props}
    />
  );
}

export default Burger;
