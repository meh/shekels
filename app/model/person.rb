class Person < Lissio::Model
	adapter Lissio::Adapter::Storage

	property :name, primary: true

	def debts(&block)
		Payments.fetch(name: name, sign: :-, &block)
	end

	def credits(&block)
		Payments.fetch(name: name, sign: :+, &block)
	end
end
