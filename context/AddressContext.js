import React, { createContext, useState } from "react";

export const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const [currentAddress, setCurrentAddress] = useState(null);

  return (
    <AddressContext.Provider value={{ currentAddress, setCurrentAddress }}>
      {children}
    </AddressContext.Provider>
  );
};
