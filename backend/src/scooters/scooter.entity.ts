import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScooterStatus } from '../common/enums';
import { NumericTransformer } from '../common/numeric.transformer';

@Entity('scooters')
export class Scooter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'number', unique: true })
  number: string;

  @Column()
  model: string;

  @Column({ type: 'enum', enum: ScooterStatus, default: ScooterStatus.AVAILABLE })
  status: ScooterStatus;

  @Column({ name: 'battery_level', type: 'int', default: 100 })
  batteryLevel: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, transformer: new NumericTransformer() })
  lat: number;

  @Column({ type: 'numeric', precision: 9, scale: 6, transformer: new NumericTransformer() })
  lng: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
