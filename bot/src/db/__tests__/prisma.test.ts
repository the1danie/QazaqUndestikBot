import { prisma } from "../prisma";

describe("prisma client", () => {
  it("exports a PrismaClient instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });
});
