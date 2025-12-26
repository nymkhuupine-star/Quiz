"use client";

import { useEffect } from "react";

const Home = () => {
  const getData = async () => {
    try {
      const data = await fetch("/api/article");
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    void getData();
  }, []);

  return <div> hii </div>;
};
export default Home;
