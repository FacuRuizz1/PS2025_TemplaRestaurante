export interface MenuSubmenuItem {
  label: string;
  route: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
  hasSubmenu: boolean;
  submenu?: MenuSubmenuItem[];
}

// Nueva interface para la data del routing
export interface RouteMenuData {
  showInMenu?: boolean;
  menuLabel?: string;
  icon?: string;
  parentMenu?: string;
  order?: number;
}