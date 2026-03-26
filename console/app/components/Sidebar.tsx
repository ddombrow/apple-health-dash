import cn from "classnames";
import { Link, useLocation } from "react-router";

import {
  Calendar16Icon,
  Monitoring16Icon,
  Action16Icon,
  Heart16Icon,
  Info16Icon,
  Metrics16Icon,
  Overview16Icon,
} from "@oxide/design-system/icons/react";

import { useIsActivePath } from "~/hooks/use-is-active-path";

const linkStyles = (isActive = false) =>
  cn(
    "flex h-7 items-center rounded-md px-2 text-sans-md [&>svg]:mr-2",
    isActive
      ? "text-accent bg-accent hover:bg-accent-hover [&>svg]:text-accent-tertiary"
      : "hover:bg-hover [&>svg]:text-quaternary text-default",
  );

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  end?: boolean;
};

const NavLinkItem = ({ to, children, end }: NavLinkProps) => {
  const currentPathIsCreateForm = useLocation().pathname.startsWith(
    `${to}-new`,
  );
  const isActive = useIsActivePath({ to, end });
  return (
    <li>
      <Link
        to={to}
        className={linkStyles(isActive || currentPathIsCreateForm)}
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </Link>
    </li>
  );
};

const HealthDataIcon = () => (
  <svg
    viewBox="0 0 110 106"
    className="h-[7rem] w-[7rem]"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      fill: "rgb(0, 211, 143)",
      fillRule: "evenodd",
      clipRule: "evenodd",
    }}
  >
    <path
      d="M97.604,56.67c-5.937,-5.89 -15.594,-5.89 -21.531,0c-0.187,0.188 -0.375,0.391 -0.562,0.594c-0.188,-0.203 -0.375,-0.406 -0.563,-0.594c-5.937,-5.89 -15.594,-5.89 -21.531,0c-2.875,2.86 -4.469,6.657 -4.469,10.703c0,4.047 1.579,7.844 4.469,10.719l21,20.578c0.297,0.297 0.703,0.454 1.094,0.454c0.391,-0 0.797,-0.157 1.094,-0.454l21,-20.578c2.875,-2.859 4.469,-6.656 4.469,-10.703c-0,-4.046 -1.578,-7.843 -4.469,-10.703l-0.001,-0.016Zm-2.203,19.203l-19.906,19.5l-19.891,-19.484c-2.281,-2.265 -3.547,-5.281 -3.547,-8.5c0,-3.218 1.266,-6.218 3.547,-8.484c2.36,-2.344 5.469,-3.516 8.563,-3.516c3.093,0 6.203,1.172 8.562,3.516c0.531,0.531 1.031,1.141 1.469,1.781c0.578,0.86 2,0.86 2.578,0c0.438,-0.656 0.938,-1.25 1.469,-1.781c4.719,-4.687 12.406,-4.687 17.125,0c2.281,2.266 3.547,5.281 3.547,8.484c-0,3.204 -1.25,6.219 -3.531,8.485l0.015,-0.001Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M88.01,72.56l-3.844,0l-2.656,-3.984c-0.312,-0.469 -0.812,-0.719 -1.39,-0.687c-0.563,0.031 -1.047,0.359 -1.297,0.859l-3.188,6.359l-3.359,-7.843c-0.219,-0.516 -0.703,-0.875 -1.25,-0.938c-0.563,-0.062 -1.11,0.172 -1.438,0.609l-4.218,5.625l-3.907,0c-0.859,0 -1.562,0.704 -1.562,1.563c-0,0.859 0.703,1.562 1.562,1.562l4.688,0c0.484,0 0.953,-0.234 1.25,-0.625l3.062,-4.093l3.625,8.453c0.235,0.562 0.782,0.922 1.391,0.953l0.047,-0c0.594,-0 1.125,-0.328 1.39,-0.86l3.485,-6.968l1.625,2.453c0.297,0.437 0.781,0.703 1.297,0.703l4.687,-0c0.86,-0 1.563,-0.703 1.563,-1.563c-0,-0.859 -0.703,-1.562 -1.563,-1.562l0,-0.016Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M57.01,86.623l-39.312,0c-3.453,0 -6.25,-2.796 -6.25,-6.25l0,-65.625c0,-3.453 2.797,-6.25 6.25,-6.25l12.5,0l0,3.125l-12.5,0c-1.719,0 -3.125,1.407 -3.125,3.125l0,65.625c0,1.719 1.406,3.125 3.125,3.125l32.938,0c0.86,0 1.563,-0.703 1.563,-1.562c-0,-0.859 -0.703,-1.563 -1.563,-1.563l-32.938,0l0,-65.625l12.5,0c0,2.579 2.11,4.688 4.688,4.688l12.5,-0c2.578,-0 4.687,-2.109 4.687,-4.688l12.5,0l0,32.922c0,0.86 0.703,1.563 1.563,1.563c0.859,-0 1.562,-0.703 1.562,-1.563l0,-32.922c0,-1.718 -1.406,-3.125 -3.125,-3.125l-12.5,0l0,-3.125l12.5,0c3.453,0 6.25,2.797 6.25,6.25l0,34.578c0,0.86 0.703,1.563 1.563,1.563c0.859,-0 1.562,-0.703 1.562,-1.563l0,-34.578c0,-5.171 -4.203,-9.375 -9.375,-9.375l-46.875,0c-5.172,0 -9.375,4.204 -9.375,9.375l0,65.625c0,5.172 4.203,9.375 9.375,9.375l39.312,0c0.86,0 1.563,-0.703 1.563,-1.562c-0,-0.859 -0.703,-1.563 -1.563,-1.563Zm-8.062,-78.125l-0,6.25c-0,0.86 -0.703,1.563 -1.563,1.563l-12.5,-0c-0.859,-0 -1.562,-0.703 -1.562,-1.563l-0,-6.25l15.625,0Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M52.073,39.748l0,-6.25c0,-0.859 -0.703,-1.562 -1.562,-1.562l-4.688,-0l0,-4.688c0,-0.859 -0.703,-1.562 -1.562,-1.562l-6.25,-0c-0.86,-0 -1.563,0.703 -1.563,1.562l0,4.688l-4.687,-0c-0.86,-0 -1.563,0.703 -1.563,1.562l0,6.25c0,0.86 0.703,1.563 1.563,1.563l4.687,-0l0,4.687c0,0.86 0.703,1.563 1.563,1.563l6.25,-0c0.859,-0 1.562,-0.703 1.562,-1.563l0,-4.687l4.688,-0c0.859,-0 1.562,-0.703 1.562,-1.563Zm-3.125,-1.562l-4.687,-0c-0.86,-0 -1.563,0.703 -1.563,1.562l0,4.688l-3.125,-0l0,-4.688c0,-0.859 -0.703,-1.562 -1.562,-1.562l-4.688,-0l0,-3.125l4.688,-0c0.859,-0 1.562,-0.703 1.562,-1.563l0,-4.687l3.125,-0l0,4.687c0,0.86 0.703,1.563 1.563,1.563l4.687,-0l0,3.125Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M31.76,53.81c0,-0.859 -0.703,-1.562 -1.562,-1.562l-6.25,-0c-0.86,-0 -1.563,0.703 -1.563,1.562l0,6.25c0,0.86 0.703,1.563 1.563,1.563l6.25,-0c0.859,-0 1.562,-0.703 1.562,-1.563l0,-6.25Zm-3.125,4.688l-3.125,-0l0,-3.125l3.125,-0l0,3.125Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M36.448,55.373l4.688,0c0.859,0 1.562,-0.703 1.562,-1.562c0,-0.859 -0.703,-1.563 -1.562,-1.563l-4.688,0c-0.859,0 -1.562,0.704 -1.562,1.563c-0,0.859 0.703,1.562 1.562,1.562Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M45.823,58.498l-9.375,0c-0.859,0 -1.562,0.704 -1.562,1.563c-0,0.859 0.703,1.562 1.562,1.562l9.375,0c0.86,0 1.563,-0.703 1.563,-1.562c-0,-0.859 -0.703,-1.563 -1.563,-1.563Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M30.198,66.31l-6.25,0c-0.859,0 -1.562,0.704 -1.562,1.563l-0,6.25c-0,0.859 0.703,1.562 1.562,1.562l6.25,0c0.86,0 1.563,-0.703 1.563,-1.562l-0,-6.25c-0,-0.859 -0.703,-1.563 -1.563,-1.563Zm-1.562,6.25l-3.125,0l-0,-3.125l3.125,0l-0,3.125Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M36.448,69.436l4.688,0c0.859,0 1.562,-0.703 1.562,-1.562c0,-0.859 -0.703,-1.563 -1.562,-1.563l-4.688,0c-0.859,0 -1.562,0.704 -1.562,1.563c-0,0.859 0.703,1.562 1.562,1.562Z"
      style={{ fillRule: "nonzero" }}
    />
    <path
      d="M36.448,75.686l9.375,0c0.86,0 1.563,-0.703 1.563,-1.562c-0,-0.859 -0.703,-1.563 -1.563,-1.563l-9.375,0c-0.859,0 -1.562,0.704 -1.562,1.563c-0,0.859 0.703,1.562 1.562,1.562Z"
      style={{ fillRule: "nonzero" }}
    />
  </svg>
);

export function Sidebar() {
  return (
    <div className="text-sans-md text-raise border-secondary flex flex-col border-r">
      <div className="border-secondary flex justify-center border-b py-5">
        <HealthDataIcon />
      </div>
      <div className="mx-3 my-4 flex grow flex-col justify-between">
        <nav aria-label="Main navigation">
          <ul className="space-y-px">
            <NavLinkItem to="/" end>
              <Overview16Icon /> Home
            </NavLinkItem>
            <NavLinkItem to="/nutrition">
              <Metrics16Icon /> Nutrition
            </NavLinkItem>
            <NavLinkItem to="/workouts">
              <Action16Icon /> Workouts
            </NavLinkItem>
            <NavLinkItem to="/vitals">
              <Heart16Icon /> Vitals
            </NavLinkItem>
            <NavLinkItem to="/activity">
              <Monitoring16Icon /> Activity
            </NavLinkItem>
            <NavLinkItem to="/dailies">
              <Calendar16Icon /> Dailies
            </NavLinkItem>
          </ul>
        </nav>
        <nav aria-label="Secondary navigation">
          <ul>
            <NavLinkItem to="/about">
              <Info16Icon /> About
            </NavLinkItem>
          </ul>
        </nav>
      </div>
    </div>
  );
}
