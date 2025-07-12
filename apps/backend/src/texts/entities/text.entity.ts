import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("texts")
@Index(["user_id", "created_at"])
export class Text {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column("text")
  content: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "int", default: 0 })
  word_count: number;

  @Column({ type: "int", default: 0 })
  character_count: number;

  @Column({ type: "int", default: 0 })
  sentence_count: number;

  @Column({ type: "int", default: 0 })
  paragraph_count: number;

  @Column({ type: "jsonb", nullable: true })
  longest_words: string[];

  @Column({ type: "timestamp", nullable: true })
  analyzed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
