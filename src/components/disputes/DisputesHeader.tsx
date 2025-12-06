import React from "react";
import styles from "./DisputesHeader.module.css";
import XOConnectButton from "../XOConnectButton";
// import { SimpleWalletButton } from "../SimpleWalletButton";

export const DisputesHeader: React.FC = () => {
  return (
    <div className={styles.header}>
      <img
        src="/images/icons/header-top.svg"
        alt="Header"
        className={styles.headerImage}
      />
      {/*<SimpleWalletButton />*/}
      <XOConnectButton />
    </div>
  );
};
