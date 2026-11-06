import { Module } from '@nestjs/common';
import { StreamingConsumer } from './streaming.consumer';

@Module({
  providers: [StreamingConsumer],
})
export class StreamingModule {}
