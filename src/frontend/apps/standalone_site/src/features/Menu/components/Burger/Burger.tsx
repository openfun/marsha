import { SVGProps, useState } from 'react';

import { ReactComponent as BurgerIcon } from 'assets/svg/burger.svg';

import styles from './Burger.module.css';

type BurgerProps = SVGProps<SVGSVGElement>;

function Burger(props: BurgerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BurgerIcon
      role="button"
      className={`${styles.burgerIcon} ${isOpen ? styles.open : ''}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    />
  );
}

export default Burger;
