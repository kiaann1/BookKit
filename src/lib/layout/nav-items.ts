export type NavItem = {
  href: string;
  label: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/shelf", label: "Shelf" },
  { href: "/feed", label: "Feed" },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/people", label: "People" },
  { href: "/recommendations", label: "Discover" },
  { href: "/requests", label: "Requests" },
];

export function mobileDrawerSections(options: {
  isAdmin: boolean;
}): NavSection[] {
  return [
    {
      title: "Library",
      items: [
        { href: "/shelf", label: "Shelf" },
        { href: "/feed", label: "Feed" },
      ],
    },
    {
      title: "Discover",
      items: secondaryNavItems,
    },
    {
      title: "Account",
      items: [
        { href: "/notifications", label: "Notifications" },
        { href: "/settings", label: "Settings" },
        ...(options.isAdmin
          ? [{ href: "/admin/books", label: "Admin" }]
          : []),
      ],
    },
  ];
}

export function navItemsForUser(options: { isAdmin: boolean }) {
  const more = options.isAdmin
    ? [...secondaryNavItems, { href: "/admin/books", label: "Admin" }]
    : secondaryNavItems;

  return {
    primary: primaryNavItems,
    more,
    mobileDrawer: mobileDrawerSections(options),
  };
}
