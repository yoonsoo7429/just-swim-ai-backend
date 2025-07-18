import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Provider } from 'src/common/enum/provider.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEnum(Provider)
  readonly provider: Provider;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
