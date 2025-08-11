// Minimal ts-proto-like definition for emissions.v9.RegisterRequest
// Provides encode/fromPartial required by CosmJS Registry
/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";

export interface RegisterRequest {
  sender: string;
  topicId: number; // uint64
  owner: string;
  isReputer: boolean;
}

function createBaseRegisterRequest(): RegisterRequest {
  return { sender: "", topicId: 0, owner: "", isReputer: false };
}

export const RegisterRequest = {
  encode(message: RegisterRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.sender !== "") {
      writer.uint32(10).string(message.sender);
    }
    if (message.topicId !== 0) {
      writer.uint32(32).uint64(message.topicId);
    }
    if (message.owner !== "") {
      writer.uint32(42).string(message.owner);
    }
    if (message.isReputer === true) {
      writer.uint32(48).bool(message.isReputer);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): RegisterRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRegisterRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) break;
          message.sender = reader.string();
          continue;
        case 4:
          if (tag !== 32) break;
          message.topicId = longToNumber(reader.uint64());
          continue;
        case 5:
          if (tag !== 42) break;
          message.owner = reader.string();
          continue;
        case 6:
          if (tag !== 48) break;
          message.isReputer = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromPartial(object: DeepPartial<RegisterRequest>): RegisterRequest {
    const message = createBaseRegisterRequest();
    message.sender = object.sender ?? "";
    message.topicId = object.topicId ?? 0;
    message.owner = object.owner ?? "";
    message.isReputer = object.isReputer ?? false;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

function longToNumber(int64: { toString(): string }): number {
  const num = Number(int64.toString());
  if (num > Number.MAX_SAFE_INTEGER) {
    throw new Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  if (num < Number.MIN_SAFE_INTEGER) {
    throw new Error("Value is smaller than Number.MIN_SAFE_INTEGER");
  }
  return num;
}




