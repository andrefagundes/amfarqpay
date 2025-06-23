export class User {
  public readonly id: string
  public name: string
  public email: string
  public balance: number

  constructor(props: {
    id?: string
    name: string
    email: string
    balance: number
  }) {
    this.id = props.id ?? `user_${Math.random().toString(36).slice(2)}`
    this.name = props.name
    this.email = props.email
    this.balance = props.balance
  }
}
