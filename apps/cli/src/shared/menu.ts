import { select } from '@inquirer/prompts';

export type MenuOption<T extends string> = {
  label: string;
  value: T;
};

export async function showMenu<T extends string>(
  message: string,
  options: MenuOption<T>[]
): Promise<T> {
  return select({
    message,
    choices: options.map((option) => ({
      name: option.label,
      value: option.value,
    })),
  });
}
