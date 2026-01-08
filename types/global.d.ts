declare const global: any;

declare namespace NodeJS {
  type Timeout = ReturnType<typeof setTimeout>;
}
